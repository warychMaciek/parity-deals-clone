"use client"

import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteProduct } from "@/server/actions/products"
import { useTransition } from "react"

export const DeleteProductAlertDialogContent = ({ id }: { id: string }) => {
    const [ isDeleteIsPending, startDeleteTransition ] = useTransition()
    const { toast } = useToast()

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    startDeleteTransition(async () => {
                        const data = await deleteProduct(id)

                        if (data.message) {
                            toast({
                                title: data.error ? "Error" : "Success",
                                description: data.message,
                                variant: data.error ? "destructive" : "default" 
                            })
                        }
                    })
                }} disabled={isDeleteIsPending}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}