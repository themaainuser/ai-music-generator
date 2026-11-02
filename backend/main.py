import base64
import os
from typing import List
import uuid
import modal
from numpy import float16
from pydantic import BaseModel
import requests
import boto3

from prompts import LYRICS_GENERATOR_PROMPT, PROMPT_GENERATOR_PROMPT


app = modal.App("music-generator")

# Where the Hugging Face volume is mounted. Must be absolute so model
# downloads land in the volume and survive cold starts.
HF_CACHE_DIR = "/cache/huggingface"


image = (
    modal.Image.debian_slim()
    # .apt_install("ffmpeg", "git", "python3-pip")
    .apt_install("git","ffmpeg","libavcodec-extra")
    .pip_install_from_requirements("requirements.txt")
    .run_commands(["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step", "cd /tmp/ACE-Step && pip install ."])
    .env({"HF_HOME": HF_CACHE_DIR})
    .add_local_python_source("prompts")
)

modal_volume = modal.Volume.from_name(
    "ace-step-modals", create_if_missing=True)
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)

music_gen_secret = modal.Secret.from_name("music-gen-secret")


class AudioGenerationBase(BaseModel):
    audio_duration: float = 15.0
    seed: int = -1
    guidance_scale: float = 15.0
    infer_step: int = 60
    instrumental: bool = False


class GenerateFromDescriptionRequest(AudioGenerationBase):
    full_described_song: str


class GenerateWithCustomLyricsRequest(AudioGenerationBase):
    prompt: str
    lyrics: str


class GenerateWithDescribedLyricsRequest(AudioGenerationBase):
    prompt: str
    described_lyrics: str


class GenerateMusicResponseS3(BaseModel):
    s3_key: str
    cover_image_s3_key: str
    categories: List[str]


class GenerateMusicResponse(BaseModel):
    audio_data: str


@app.cls(
    image=image,
    gpu="L40S",
    volumes={
        "/models": modal_volume,
        HF_CACHE_DIR: hf_volume
    },
    secrets=[music_gen_secret],
    scaledown_window=15
)

class MusicGenServer:
    @modal.enter()
    def load_model(self):
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image

        # Music Generation Model
        self.music_model = ACEStepPipeline(
            checkpoint_dir="/models",
            dtype="bfloat16",
            torch_compile=False,
            cpu_offload=False,
            overlapped_decode=False
        )

        # Large Language Model
        model_id = "Qwen/Qwen2-7B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype="auto",
            device_map="auto",
            cache_dir=HF_CACHE_DIR,
        )

        self.image_pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", torch_dtype=float16, variant="fp16", cache_dir=HF_CACHE_DIR)
        self.image_pipe.to("cuda")

    def qwen_prompt(self, question: str):
        messages = [
            {"role": "user", "content": question}
        ]
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        model_inputs = self.tokenizer(
            [text], return_tensors="pt").to(self.llm_model.device)

        generated_ids = self.llm_model.generate(
            model_inputs.input_ids,
            max_new_tokens=512
        )
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        response = self.tokenizer.batch_decode(
            generated_ids, skip_special_tokens=True)[0]

        return response

    def generate_prompt(self, description: str):
        # insert description into templete
        full_prompt = PROMPT_GENERATOR_PROMPT.format(user_prompt=description)
        # Run LLM inference and run that
        return self.qwen_prompt(full_prompt)

    def generate_lyrics(self, description: str):
        # insert description into templete
        full_prompt = LYRICS_GENERATOR_PROMPT.format(description=description)
        # Run LLM inference and run that
        return self.qwen_prompt(full_prompt)

    def generate_categories(self, description: str):
        prompt = f"Based on the following music description, list 3-5 relevant genres or categories as a comma-separated list. For example: Pop, Electronic, Sad, 80s. Description: '{description}'"

        response_text = self.qwen_prompt(prompt)
        categories = [cat.strip()
                      for cat in response_text.split(",") if cat.strip()]
        return categories

    def generate_and_upload_to_s3(
        self,
        prompt: str,
        lyrics: str,
        audio_duration: float,
        infer_step: int,
        guidance_scale: float,
        instrumental: bool,
        seed: int,
        description_for_categories: str
    ) -> GenerateMusicResponseS3:

        final_lyrics = "[instrumental]" if instrumental else lyrics
        print(f"generated lyrics: {final_lyrics}")
        print(f"generated prompt: {prompt}")

        s3_client = boto3.client("s3")
        bucket_name = os.environ["S3_BUCKET_NAME"]

        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)

        # -----------------------
        # 🎵 Generate Audio
        # -----------------------
        audio_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(output_dir, audio_filename)

        self.music_model(
            prompt=prompt,
            lyrics=final_lyrics,
            audio_duration=audio_duration,
            infer_step=infer_step,
            guidance_scale=guidance_scale,
            save_path=output_path,
            manual_seeds=str(seed)
        )

        audio_s3_key = f"generated/{audio_filename}"
        s3_client.upload_file(output_path, bucket_name, audio_s3_key)
        os.remove(output_path)

        # -----------------------
        # 🖼 Generate Thumbnail
        # -----------------------
        thumbnail_prompt = f"{prompt}, album cover art"

        image_result = self.image_pipe(
            prompt=thumbnail_prompt,
            num_inference_steps=2,
            guidance_scale=0.0
        )

        image = image_result.images[0]

        image_filename = f"{uuid.uuid4()}.png"
        image_output_path = os.path.join(output_dir, image_filename)

        image.save(image_output_path)

        image_s3_key = f"generated/{image_filename}"
        s3_client.upload_file(image_output_path, bucket_name, image_s3_key)
        os.remove(image_output_path)

        # -----------------------
        # 🏷 Generate Categories
        # -----------------------
        categories = self.generate_categories(description_for_categories)

        return GenerateMusicResponseS3(
            s3_key=audio_s3_key,
            cover_image_s3_key=image_s3_key,
            categories=categories
        )

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate(self) -> GenerateMusicResponse:
        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
            prompt="electronic rap",
            lyrics="[verse]\nWaves on the bass, pulsing in the speakers,\nTurn the dial up, we chasing six-figure features,\nGrinding on the beats, codes in the creases,\nDigital hustler, midnight in sneakers.\n\n[chorus]\nElectro vibes, hearts beat with the hum,\nUrban legends ride, we ain't ever numb,\nCircuits sparking live, tapping on the drum,\nLiving on the edge, never succumb.\n\n[verse]\nSynthesizers blaze, city lights a glow,\nRhythm in the haze, moving with the flow,\nSwagger on stage, energy to blow,\nFrom the blocks to the booth, you already know.\n\n[bridge]\nNight's electric, streets full of dreams,\nBass hits collective, bursting at seams,\nHustle perspective, all in the schemes,\nRise and reflective, ain't no in-betweens.\n\n[verse]\nVibin' with the crew, sync in the wire,\nGot the dance moves, fire in the attire,\nRhythm and blues, soul's our supplier,\nRun the digital zoo, higher and higher.\n\n[chorus]\nElectro vibes, hearts beat with the hum,\nUrban legends ride, we ain't ever numb,\nCircuits sparking live, tapping on the drum,\nLiving on the edge, never succumb.",
            audio_duration=180,
            infer_step=60,
            guidance_scale=15,
            save_path=output_path
        )

        with open(output_path, "rb") as f:
            audio_bytes = f.read()

        audio_64 = base64.b64encode(audio_bytes).decode("utf-8")

        os.remove(output_path)

        return GenerateMusicResponse(audio_data=audio_64)

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_from_description(self, request: GenerateFromDescriptionRequest) -> GenerateMusicResponseS3:
        prompt = self.generate_prompt(request.full_described_song)

        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.full_described_song)

        return self.generate_and_upload_to_s3(prompt=prompt, lyrics=lyrics, description_for_categories=request.full_described_song, **request.model_dump(exclude={"full_described_song"}))

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_lyrics(self, request: GenerateWithCustomLyricsRequest) -> GenerateMusicResponseS3:
        return self.generate_and_upload_to_s3(prompt=request.prompt, lyrics=request.lyrics, description_for_categories=request.prompt, **request.model_dump(exclude={"prompt", "lyrics"}))

    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def generate_with_described_lyrics(self, request: GenerateWithDescribedLyricsRequest) -> GenerateMusicResponseS3:
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.described_lyrics)

        return self.generate_and_upload_to_s3(prompt=request.prompt, lyrics=lyrics, description_for_categories=request.prompt, **request.model_dump(exclude={"described_lyrics", "prompt"}))

@app.local_entrypoint()
def main():
    server = MusicGenServer()
    endpoint_url = server.generate_with_described_lyrics.get_web_url()

    request_data = GenerateWithDescribedLyricsRequest(
        prompt="rave, funk, 140BPM, disco",
        described_lyrics="lyrics about water bottles",
        guidance_scale=15
    )
    headers = {
        "Modal-Key": os.environ["MODAL_KEY"],
        "Modal-Secret": os.environ["MODAL_SECRET"]
    }
    payload = request_data.model_dump()

    response = requests.post(endpoint_url, json=payload, headers=headers)
    response.raise_for_status()
    result = GenerateMusicResponseS3(**response.json())

    print(
        f"Success: {result.s3_key} {result.cover_image_s3_key} {result.categories}")

    # audio_bytes = base64.b64decode(result.audio_data)
    # output_filename = "generated.wav"
    # with open(output_filename, "wb") as f:
    #     f.write(audio_bytes)