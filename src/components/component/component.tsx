
import { Separator } from "@/components/ui/separator"
import { CardHeader, CardContent, Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuContent, DropdownMenu } from "@/components/ui/dropdown-menu"

export function Component() {
  return (
    <Card className="mx-auto max-w-md p-6">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">John Doe</div>
          <div className="text-gray-500 dark:text-gray-400">$2,500.00</div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full" variant="outline">
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              Logout
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Change Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

