"use client"

import Banner from "@/components/Banner"
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { productCustomizationsSchema } from "@/schemas/products"
import { updateProductCustomization } from "@/server/actions/products"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

export function ProductCustomizationForm({
    canRemoveBranding,
    canCustomizeBanner,
    customization
}: {
    canRemoveBranding: boolean
    canCustomizeBanner: boolean
    customization: {
        productId: string
        locationMessage: string
        backgroundColor: string
        textColor: string
        fontSize: string
        bannerContainer: string
        isSticky: boolean
        classPrefix: string | null
    }
}) {
    const { toast } = useToast()
    const form = useForm<z.infer<typeof productCustomizationsSchema>>({
        resolver: zodResolver(productCustomizationsSchema),
        defaultValues: {
            ...customization,
            classPrefix: customization.classPrefix ?? ""
        }
    })

    async function onSubmit(values: z.infer<typeof productCustomizationsSchema>) {
        const data = await updateProductCustomization(customization.productId, values)

        if (data?.message) {
            toast({
                title: data.error ? "Error" : "Success",
                description: data.message,
                variant: data.error ? "destructive" : "default"
            })
        }
    }

    const formValues = form.watch()

    return (
        <>
            <Banner 
                message={formValues.locationMessage}
                mappings={{
                    country: "United States",
                    coupon: "SUMMER",
                    discount: "20"
                }}
                customization={formValues}
                canRemoveBranding={canRemoveBranding}
            />
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex gap-6 flex-col mt-8"
                >
                    <div className="grid gap-8 grid-cols-1 md:grid-col-2">
                        <FormField 
                            control={form.control}
                            name="locationMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        PPP Discount Message
                                        <RequiredLabelIcon />
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            disabled={!canCustomizeBanner} 
                                            className="min-h-20 resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {"Data Parameters: {country}, {coupon}, {discount}"}
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="backgroundColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Background Color
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input disabled={!canCustomizeBanner} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="textColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Text Color
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input disabled={!canCustomizeBanner} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fontSize"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Font size
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input disabled={!canCustomizeBanner} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isSticky"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sticky?</FormLabel>
                                        <FormControl>
                                            <Switch
                                                className="block"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!canCustomizeBanner}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bannerContainer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Banner Container
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input disabled={!canCustomizeBanner} {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            HTML container selector where you want to place the banner. Ex: #container, .container, body
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="classPrefix"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            CSS Prefix
                                        </FormLabel>
                                        <FormControl>
                                            <Input disabled={!canCustomizeBanner} {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            An optional prefix added to all CSS classes to avoid conflicts
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>    
                    {canCustomizeBanner && (
                        <div className="self-end">
                            <Button disabled={form.formState.isSubmitting} type="submit">
                                Save
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </>
    )
}