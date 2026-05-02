import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Conversation, Message } from "@/types";

const unwrap = <T,>(data: unknown): T => {
  const d = data as { data?: T; items?: T; conversations?: T; messages?: T };
  return (d?.data ?? d?.items ?? d?.conversations ?? d?.messages ?? data) as T;
};

export const useConversations = () =>
  useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get("/conversations");
      return unwrap<Conversation[]>(data);
    },
    refetchInterval: 30_000,
  });

export const useMessages = (conversationId?: string) =>
  useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`);
      return unwrap<Message[]>(data);
    },
  });

interface SendInput {
  conversationId: string;
  body?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "audio" | "file";
}

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendInput) => {
      const { data } = await api.post(
        `/conversations/${input.conversationId}/messages`,
        {
          body: input.body,
          attachmentUrl: input.attachmentUrl,
          attachmentType: input.attachmentType,
        },
      );
      return unwrap<Message>(data);
    },
    onSuccess: (_msg, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useStartConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { recipientId: string; productId?: string }) => {
      const { data } = await api.post("/conversations", input);
      return unwrap<Conversation>(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
};

/** Subscribe to incoming messages in real-time via socket. */
export const useMessageSocket = (conversationId?: string) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    socket.emit("conversation:join", { conversationId });

    const onNew = (msg: Message) => {
      const cid = msg.conversation;
      if (!cid) return;
      qc.setQueryData<Message[]>(["messages", cid], (prev) =>
        prev ? (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]) : [msg],
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message:new", onNew);
    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onNew);
    };
  }, [conversationId, qc]);
};

/** Upload a file (image/audio) and return its URL. */
export const uploadFile = async (file: File | Blob, filename = "voice-note.webm"): Promise<string> => {
  const fd = new FormData();
  const f = file instanceof File ? file : new File([file], filename, { type: file.type });
  fd.append("file", f);
  const { data } = await api.post("/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const d = data as { url?: string; data?: { url?: string }; secure_url?: string };
  return d.url ?? d.data?.url ?? d.secure_url ?? "";
};
