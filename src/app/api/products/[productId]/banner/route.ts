import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NextRequest } from "next/server"
import { geolocation } from "@vercel/functions"
import { env } from "@/data/env/server"
import { getProductForBanner } from "@/server/db/products"
import { createProductView } from "@/server/db/productViews"
import { canRemoveBranding, canShowDiscountBanner } from "@/server/permissions"
import { createElement } from "react"
import Banner from "@/components/Banner"

export async function GET(
    request: NextRequest,
    { params: { productId } }: { params: { productId: string } }
) {
    const headersMap = await headers()
    const requestingUrl = headersMap.get("referer") || headersMap.get("origin")
    if (requestingUrl == null) return notFound()

    const countryCode = getCountryCode(request)
    if (countryCode == null) return notFound()

    const { product, discount, country } = await getProductForBanner({
        id: productId,
        countryCode,
        url: requestingUrl
    })

    if (product == null) return notFound()

    const canShowBanner = await canShowDiscountBanner(product.clerkUserId)

    await createProductView({
        productId: product.id,
        countryId: country?.id,
        userId: product.clerkUserId
    })

    if (!canShowBanner) return notFound()
    if (discount == null || country == null) return notFound()

    return new Response(
        await getJavaScript(
            product, 
            country, 
            discount, 
            await canRemoveBranding(product.clerkUserId)
        ),
        { headers: { "content-type": "text/javascript" } }
    )
}

function getCountryCode(request: NextRequest) {
    const geo = geolocation(request)

    if (geo.country != null) return geo.country
    if (process.env.NODE_ENV === "development") {
        return env.TEST_COUNTRY_CODE
    }
}

async function getJavaScript(
    product: {
        customization: {
            locationMessage: string
            bannerContainer: string
            backgroundColor: string
            textColor: string
            fontSize: string
            isSticky: boolean
            classPrefix?: string | null
        }
    },
    country: { name: string },
    discount: { coupon: string, discountPercentage: number },
    canRemoveBranding: boolean
) {
    const { renderToStaticMarkup } = await import("react-dom/server")
    return `
        const banner = document.createElement("div");
        banner.innerHTML = '${renderToStaticMarkup(createElement(Banner, {
            message: product.customization.locationMessage,
            mappings: {
                country: country.name,
                coupon: discount.coupon,
                discount: (discount.discountPercentage * 100).toString()
            },
            customization: product.customization,
            canRemoveBranding
        }))}';
        document.querySelector("${product.customization.bannerContainer}").prepend(...banner.children);
    `.replace(/(\r\n|\n|\r)/g, "")
}