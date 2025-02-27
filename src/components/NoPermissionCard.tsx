import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";

export function NoPermissionCard({
    children = "You do not have permission to perform this action. Try upgrading your account to access this feature.",
}: {
    children?: ReactNode
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Permission Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>{children}</CardDescription>
            </CardContent>
            <CardFooter>
                <Button asChild>
                    <Link href="/dashboard/subscription">Upgrade Account</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}