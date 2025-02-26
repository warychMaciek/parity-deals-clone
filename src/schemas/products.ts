import { removeTrailingSlash } from "@/lib/utils";
import { z } from "zod";

export const productDetailsSchema = z.object({
    name: z.string().min(1, "Required"),
    url: z.string().url().min(1, "Required").transform(removeTrailingSlash),
    description: z.string().optional(),
})

export const productCountryDiscountsSchema = z.object({
    groups: z.array(
        z.object({
            countryGroupId: z.string().min(1, "Required"),
            discountPercentage: z
                .number()
                .max(100)
                .min(1)
                .or(z.nan())
                .transform(n => (isNaN(n) ? null : n))
                .optional(),
            coupon: z.string().optional(),
        })
        .refine(
            value => {
                const hasCoupon = value.coupon != null && value.coupon.length > 0
                const hasDiscount = value.discountPercentage != null
                return !(hasCoupon && !hasDiscount)
            },
            {
                message: "A discount is required if a coupon is provided",
                path: ["root"]
            }
        )
    )
})

export const productCustomizationsSchema = z.object({
    classPrefix: z.string().optional(),
    backgroundColor: z.string().min(1, "Required"),
    textColor: z.string().min(1, "Required"),
    fontSize: z.string().min(1, "Required"),
    locationMessage: z.string().min(1, "Required"),
    bannerContainer: z.string().min(1, "Required"),
    isSticky: z.boolean(),
})