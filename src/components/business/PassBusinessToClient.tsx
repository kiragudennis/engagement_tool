// @/components/business/PassBusinessToClient.tsx
// This component is used to pass the business data to the client side. It is used in the business landing page and the spin game page. It is used to pass the business data to the client side so that it can be used in the client side components.
"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useEffect } from "react";

interface PassBusinessToClientProps {
  business: any;
}

export function PassBusinessToClient({ business }: PassBusinessToClientProps) {
  const { setBusiness } = useAuth();
  useEffect(() => {
    if (business) {
      setBusiness(business);
    }
  }, [business, setBusiness]);
  return null;
}
