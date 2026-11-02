import importlib.metadata as metadata
from multiprocessing import Process, Queue
import sys


def _read_text(path, q):
    try:
        txt = path.read_text(encoding="utf-8")
        q.put(("ok", len(txt)))
    except Exception as e:
        q.put(("err", str(e)))


def main(timeout: float = 5.0):
    print("Scanning distributions for slow entry_points.txt reads...")
    for dist in metadata.distributions():
        try:
            name = dist.metadata.get("Name") or getattr(
                dist, "name", str(dist))
        except Exception:
            name = getattr(dist, "name", str(dist))
        try:
            ep_path = dist.locate_file("entry_points.txt")
        except Exception as e:
            print(f"{name}: cannot locate entry_points.txt ({e})")
            continue

        print(f"Checking {name}: {ep_path}")
        q = Queue()
        p = Process(target=_read_text, args=(ep_path, q))
        p.start()
        p.join(timeout)
        if p.is_alive():
            p.terminate()
            p.join()
            print(f"  TIMEOUT reading {ep_path} for {name}")
        else:
            if not q.empty():
                status, info = q.get()
                print(f"  {status}: {info}")
            else:
                print("  no result (possibly empty or missing)")


if __name__ == "__main__":
    t = 5.0
    if len(sys.argv) > 1:
        try:
            t = float(sys.argv[1])
        except Exception:
            pass
    main(timeout=t)
