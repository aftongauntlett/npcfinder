import React from "react";
import Chip from "../../../shared/ui/Chip";
import type { InviteCode } from "../../../../lib/inviteCodes";
import { determineCodeStatus } from "./inviteCodeUtils";

interface InviteCodeStatusBadgeProps {
  code: InviteCode;
}

const InviteCodeStatusBadge: React.FC<InviteCodeStatusBadgeProps> = ({
  code,
}) => {
  const { label, variant } = determineCodeStatus(code);

  return (
    <Chip variant={variant} size="sm">
      {label}
    </Chip>
  );
};

export default InviteCodeStatusBadge;
