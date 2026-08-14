// src/lib/config/consultation-services.ts
import {
  Phone,
  Braces,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ConsultationService {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  priceKes: number;
  duration: string;
  features: string[];
  icon: LucideIcon;
  colorGradient: string;
  popular?: boolean;
}

export const CONSULTATION_SERVICES: ConsultationService[] = [
  {
    id: "strategy-session",
    name: "Strategy Session",
    description:
      "60-minute strategic consultation to map your winning engagement architecture.",
    longDescription:
      "We analyze your business, audience, and goals to design the perfect engagement strategy. You will leave with a clear roadmap for which modules to deploy, how to sequence them, and what ROI to expect. Perfect for businesses that want to understand the 'why' before building.",
    priceKes: 15000,
    duration: "60 minutes",
    features: [
      "Business requirements & audience analysis",
      "Module architecture recommendation",
      "ROI projection based on your traffic data",
      "Live demo of all 5 modules in action",
      "Technical feasibility assessment",
      "Q&A with lead engagement architect",
      "Written strategy document delivered within 24h",
    ],
    icon: Phone,
    colorGradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "implementation",
    name: "Implementation",
    description:
      "Developer-assisted integration of Engage endpoints into your existing stack.",
    longDescription:
      "Our team works side-by-side with yours to integrate Engage APIs into your existing infrastructure. We handle the endpoint setup, data flow mapping, and testing. You get a fully working integration plus knowledge transfer so your team can maintain it. Includes pre-implementation strategy session.",
    priceKes: 75000,
    duration: "3-5 days",
    popular: true,
    features: [
      "Everything in Strategy Session",
      "API endpoint integration with your stack",
      "Database schema mapping & migration",
      "Custom webhook configuration",
      "POS / e-commerce platform sync",
      "End-to-end testing & QA",
      "2 weeks post-launch support",
      "Documentation & handover",
    ],
    icon: Braces,
    colorGradient: "from-purple-500 to-pink-500",
  },
  {
    id: "full-custom-build",
    name: "Full Custom Build",
    description:
      "End-to-end custom engagement platform built and maintained by our professionals.",
    longDescription:
      "For businesses that want a completely tailored solution. We assign a dedicated project lead who designs, builds, tests, and deploys a custom engagement platform built around your specific needs. From unique game mechanics to custom admin dashboards and third-party integrations, we handle every line of code. You own the deliverable.",
    priceKes: 250000,
    duration: "2-4 weeks",
    features: [
      "Everything in Implementation",
      "Dedicated project manager & developer",
      "Custom game mechanics & rules engine",
      "Bespoke admin dashboard",
      "Third-party integrations (ERP, CRM, accounting)",
      "Custom reporting & analytics",
      "On-site or remote training for your team",
      "30-day priority support & bug fixes",
      "Source code handover & documentation",
    ],
    icon: Users,
    colorGradient: "from-amber-500 to-orange-500",
  },
];

export const CONSULTATION_FAQS = [
  {
    question: "How does professional assignment work?",
    answer:
      "Once your payment is confirmed, our operations team reviews your requirements and assigns the best-matched professional from our pool. Strategy sessions are handled by engagement architects. Implementation and full builds are assigned to senior developers with relevant stack experience. You will receive an intro email within 4 business hours.",
  },
  {
    question: "Are payments released to the professional immediately?",
    answer:
      "Yes. When you pay via Paystack, funds are settled to Engage. We then compensate the assigned professional immediately upon delivery confirmation. You are billed once; the professional is paid a third-party fee as part of our fulfillment process.",
  },
  {
    question: "What if I need custom game mechanics?",
    answer:
      "The Full Custom Build tier is designed exactly for this. We can build entirely new game types, custom prize logic, unique broadcast displays, and anything else your brand needs. Strategy and Implementation tiers use our existing module set.",
  },
  {
    question: "Do I need to have an existing Engage account?",
    answer:
      "No. You can book a consultation before signing up. For Implementation and Full Custom Build, we will set up the necessary infrastructure as part of the project.",
  },
  {
    question: "What happens after implementation?",
    answer:
      "You receive full documentation, source code access, and a knowledge-transfer session. The Implementation tier includes 2 weeks of post-launch support. The Full Custom Build tier includes 30 days of priority support.",
  },
  {
    question: "Can I get a refund if the engagement doesn't work out?",
    answer:
      "Strategy sessions are non-refundable once delivered. Implementation and Full Custom Build projects include milestone approvals. If we miss a milestone, you can pause the project and request a partial refund for incomplete work.",
  },
];

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
