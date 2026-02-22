"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiGet } from "@/lib/api";

interface Expert {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  expertise: string[];
  portfolio: string[];
}

export default function BrowseExpertsPage() {
  const { socket } = useSocket();
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [asking, setAsking] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/farmer/experts").then(res => {
      if (res.success) setExperts(res.data);
    });
  }, []);

  const handleAskExpert = (expertId: string) => {
    if (!socket || asking) return;
    setAsking(expertId);
    socket.emit("start_conversation", { recipientId: expertId });
    const handleConversationReady = (data: { conversation?: { id: string } }) => {
      socket.off("conversation_ready", handleConversationReady);
      setAsking(null);
      if (data.conversation?.id) {
        router.push(`/farmer-dashboard/chat?conversationId=${data.conversation.id}`);
      } else {
        router.push("/farmer-dashboard/chat");
      }
    };
    socket.on("conversation_ready", handleConversationReady);
    setTimeout(() => {
      socket.off("conversation_ready", handleConversationReady);
      setAsking(null);
    }, 5000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Browse Experts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experts.map(expert => (
          <Card key={expert.id} className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-2">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {expert.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg text-gray-900">{expert.name}</div>
                  <div className="text-sm text-gray-600">Rating: {expert.rating.toFixed(1)}</div>
                </div>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-700">Expertise:</span>
                <ul className="list-disc ml-6 text-sm text-gray-600">
                  {expert.expertise.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-700">Portfolio:</span>
                <ul className="list-disc ml-6 text-sm text-gray-600">
                  {expert.portfolio.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <Button
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
                disabled={asking === expert.id}
                onClick={() => handleAskExpert(expert.id)}
              >
                {asking === expert.id ? "Starting..." : "Ask Expert"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {experts.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No experts found yet.
          </div>
        )}
      </div>
    </div>
  );
}
