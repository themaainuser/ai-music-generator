import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { db } from "~/server/db";
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env";

const polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: 'sandbox'
});

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
    },
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "1b6c0da0-404a-4109-8f2d-5ca454adcec2",
                            slug: "Large"
                        },
                        {
                            productId: "6a8d6ff6-c230-4956-9593-a91c438bbd3f",
                            slug: "Medium"
                        },
                        {
                            productId: "99935252-b8a7-4353-9727-8bb951e5aebd",
                            slug: "Small"
                        }
                    ],
                    successUrl: "/",
                    authenticatedUsersOnly: true
                }),
                portal(),
                webhooks({
                    secret: env.POLAR_WEBHOOK_SECRET,
                    onOrderPaid: async (order) => {
                        const externalCustomerId = order.data.customer.externalId

                        if (!externalCustomerId) {
                            throw new Error("External customer ID is missing")
                        }

                        const productId = order.data.productId;
                        let creditsToAdd = 0;
                        switch (productId) {
                            case "1b6c0da0-404a-4109-8f2d-5ca454adcec2":
                                creditsToAdd = 50;
                                break;
                            case "6a8d6ff6-c230-4956-9593-a91c438bbd3f":
                                creditsToAdd = 15;
                                break;
                            case "99935252-b8a7-4353-9727-8bb951e5aebd":
                                creditsToAdd = 5;
                                break;
                        }

                        await db.user.update({
                            where: {
                                id: externalCustomerId
                            },
                            data: {
                                credits: {
                                    increment: creditsToAdd
                                }
                            }
                        })
                    }
                })
            ],
        })
    ]
});
