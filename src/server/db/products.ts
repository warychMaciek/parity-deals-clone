import { db } from "@/drizzle/db";
import { CountryGroupDiscountTable, ProductCustomizationTable, ProductTable } from "@/drizzle/schema";
import { CACHE_TAGS, dbCache, getGlobalTag, getIdTag, getUserTag, revalidateDbCache } from "@/lib/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";

export function getProductCountryGroups({ productId, userId }: { productId: string, userId: string }) {
    const cacheFn = dbCache(getProductCountryGroupsInternal, {
        tags: [
            getIdTag(productId, CACHE_TAGS.products), 
            getGlobalTag(CACHE_TAGS.countries),
            getGlobalTag(CACHE_TAGS.countryGroups)
        ]
    })

    return cacheFn({ productId, userId })
}

export function getProducts(userId: string, { limit }: { limit?: number }) {
    const cacheFn = dbCache(getProductsInternal, {
        tags: [getUserTag(userId, CACHE_TAGS.products)]
    })

    return cacheFn(userId, { limit })
}

export function getProduct({ id, userId }: { id: string, userId: string }) {
    const cacheFn = dbCache(getProductInternal, {
        tags: [getIdTag(id, CACHE_TAGS.products)]
    })

    return cacheFn({ id, userId })
}

export async function createProduct(data: typeof ProductTable.$inferInsert) {
    const [newProduct] = await db
        .insert(ProductTable)
        .values(data)
        .returning({ id: ProductTable.id, userId: ProductTable.clerkUserId })

    try {
        await db.insert(ProductCustomizationTable).values({
            productId: newProduct.id
        }).onConflictDoNothing({
            target: ProductCustomizationTable.productId
        })
    } catch (e) {
        await db.delete(ProductTable).where(eq(ProductTable.id, newProduct.id))
    }

    revalidateDbCache({
        tag: CACHE_TAGS.products,
        userId: newProduct.userId,
        id: newProduct.id
    })

    return newProduct
}

export async function updateProduct(
    data: Partial<typeof ProductTable.$inferInsert>, 
    { id, userId }: { id: string, userId: string}
) {
    const { rowCount } = await db
        .update(ProductTable)
        .set(data)
        .where(and(eq(ProductTable.id, id), eq(ProductTable.clerkUserId, userId)))

    if (rowCount > 0) {
        revalidateDbCache({
            tag: CACHE_TAGS.products,
            userId,
            id
        })
    }

    return rowCount > 0
}

export async function deleteProduct({ id, userId }: { id: string, userId: string }) {
    const { rowCount } = await db
        .delete(ProductTable)
        .where(and(eq(ProductTable.id, id), eq(ProductTable.clerkUserId, userId)))

    if (rowCount > 0) {
        revalidateDbCache({
            tag: CACHE_TAGS.products,
            userId,
            id
        })
    }

    return rowCount > 0
}

export async function updateCountryDiscounts(
    deleteGroup: { countryGroupId: string }[],
    insertGroup: ( typeof CountryGroupDiscountTable.$inferInsert )[],
    { productId, userId }: { productId: string, userId: string }
) {
    const product = await getProduct({ id: productId, userId })
    if (product == null) return false

    const statements: BatchItem<"pg">[] = []
    if (deleteGroup.length > 0) {
        statements.push(
            db.delete(CountryGroupDiscountTable).where(
                and(
                    eq(CountryGroupDiscountTable.productId, productId),
                    inArray(CountryGroupDiscountTable.countryGroupId, deleteGroup.map(group => group.countryGroupId))
                )
            )
        )
    }

    if (insertGroup.length > 0) {
        statements.push(
            db
                .insert(CountryGroupDiscountTable)
                .values(insertGroup)
                .onConflictDoUpdate({
                    target: [
                        CountryGroupDiscountTable.productId,
                        CountryGroupDiscountTable.countryGroupId
                    ],
                    set: {
                        coupon: sql.raw(
                            `excluded.${CountryGroupDiscountTable.coupon.name}`
                        ),
                        discountPercentage: sql.raw(
                            `excluded.${CountryGroupDiscountTable.discountPercentage.name}`
                        )
                    }
                })
        )
    }

    if (statements.length > 0) {
        await db.batch(statements as [BatchItem<"pg">])
    }

    revalidateDbCache({
        tag: CACHE_TAGS.products,
        userId,
        id: productId
    })
}

function getProductsInternal(userId: string, { limit }: { limit?: number }) {
    return db.query.ProductTable.findMany({
        where: (({ clerkUserId }, { eq }) => eq(clerkUserId, userId)),
        orderBy: (({ createdAt }, { desc }) => desc(createdAt)),
        limit
    })
}

async function getProductCountryGroupsInternal({ productId, userId }: { productId: string, userId: string }) {
    const product = await getProduct({ id: productId, userId })
    if (product == null) return []

    const data = await db.query.CountryGroupTable.findMany({
        with: {
            countries: {
                columns: {
                    name: true,
                    code: true
                }
            },
            countryGroupDiscounts: {
                columns: {
                    coupon: true,
                    discountPercentage: true
                },
                where: (({ productId: id }, { eq }) => eq(id, productId)),
                limit: 1
            }
        }
    })

    return data.map(group => {
        return {
            id: group.id,
            name: group.name,
            recommendedDiscountPercentage: group.recommendedDiscountPercentage,
            countries: group.countries,
            discount: group.countryGroupDiscounts.at(0)
        }
    })
}

function getProductInternal({ id, userId }: { id: string, userId: string }) {
    return db.query.ProductTable.findFirst({
        where: ({ clerkUserId, id: idCol }, { eq, and }) => and(eq(clerkUserId, userId), eq(idCol, id))
    })
}