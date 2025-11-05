import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CanvasApiInstructions = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <HelpCircle className="w-4 h-4 mr-2" />
          How to get Canvas API Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Canvas API Token Setup Guide</DialogTitle>
          <DialogDescription>
            Follow these steps to generate your Canvas API access token
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </span>
                Navigate to Canvas Dashboard
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Go to your Canvas institution's website and navigate to your dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </span>
                Open User Settings
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Click on your user icon in the sidebar, then click <strong>Settings</strong> from the dropdown menu.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </span>
                Go to User Settings Page
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                You should now see a page titled "[Your Name]'s Settings"
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  4
                </span>
                Find Approved Integrations
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Scroll down to the <strong>"Approved Integrations"</strong> section.
              </p>
            </div>

            {/* Step 5 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  5
                </span>
                Create New Access Token
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Click the <strong>"+ New Access Token"</strong> button.
              </p>
            </div>

            {/* Step 6 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  6
                </span>
                Fill in Purpose
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                In the <strong>Purpose</strong> field, enter any name (e.g., "Canvas Pro" or "Study Assistant"). The name doesn't affect functionality.
              </p>
            </div>

            {/* Step 7 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  7
                </span>
                Set Expiration Date
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Click on the <strong>Expiration date</strong> field to open the calendar picker.
              </p>
            </div>

            {/* Step 8 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  8
                </span>
                Select Maximum Expiration
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Scroll to the last available date (maximum 120 days) and click on it. This ensures your token lasts as long as possible before needing renewal.
              </p>
            </div>

            {/* Step 9 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  9
                </span>
                Generate Token
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Click the <strong>"Generate Token"</strong> button in the bottom right corner.
              </p>
            </div>

            {/* Step 10 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  10
                </span>
                Copy Your API Token
              </h3>
              <div className="pl-10 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Copy the long string of letters and numbers shown at the top. This is your Canvas API key.
                </p>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Important: Once you leave this page, you won't be able to retrieve the full token anymore. You'll have to regenerate it to get a new value.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 11 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  11
                </span>
                Save to Canvas Pro
              </h3>
              <p className="text-sm text-muted-foreground pl-10">
                Paste the token into the <strong>"API Access Token"</strong> field above, then click <strong>"Save Canvas Settings"</strong>. You're all set! Enjoy your Canvas helper.
              </p>
            </div>

            {/* Additional Tips */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">💡 Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Keep your API token secure and never share it publicly</li>
                <li>You can revoke or regenerate tokens at any time from Canvas Settings</li>
                <li>If your token expires, simply generate a new one following these same steps</li>
                <li>Maximum token expiration is 120 days from the creation date</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
