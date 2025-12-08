import React from "react";
import { Shield, RefreshCw, ShieldCheck } from "lucide-react";
import Card from "../../../shared/ui/Card";

const SecurityBestPracticesSection: React.FC = () => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Security Best Practices
      </h2>

      <div className="grid gap-4">
        <Card
          spacing="md"
          className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Email-Specific Codes
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                All invite codes are tied to specific email addresses. This
                prevents code sharing and unauthorized access.
              </p>
            </div>
          </div>
        </Card>

        <Card spacing="md" className="bg-primary/10 border-primary/30">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-1">
                Auto-Expiring Codes
              </h3>
              <p className="text-sm text-primary/80">
                Codes automatically expire after 30 days and can only be used
                once. Delete unused codes to maintain security.
              </p>
            </div>
          </div>
        </Card>

        <Card
          spacing="md"
          className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                Admin Privileges
              </h3>
              <p className="text-sm text-green-800 dark:text-green-400">
                Be careful when granting admin privileges. Admins can manage all
                users and invite codes. The super admin account cannot be
                demoted.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SecurityBestPracticesSection;
