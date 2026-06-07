import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Conversation, Message } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const unwrap = <T>(data: unknown): T => {
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
      const { data } = await api.get(
        `/conversations/${conversationId}/messages`,
      );
      return unwrap<Message[]>(data);
    },
  });

interface SendInput {
  conversationId: string;
  body?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: "image" | "audio" | "file";
  productId?: string;
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
          attachmentName: input.attachmentName,
          attachmentType: input.attachmentType,
          productId: input.productId,
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

export const useDeleteConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/conversations/${conversationId}`);
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
        prev
          ? prev.some((m) => m._id === msg._id)
            ? prev
            : [...prev, msg]
          : [msg],
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
    };
    const onStatus = (payload: {
      conversationId?: string;
      messageIds?: string[];
      status?: Message["status"];
      deliveredAt?: string;
      readAt?: string;
    }) => {
      const cid = payload.conversationId;
      if (!cid || !payload.messageIds?.length || !payload.status) return;
      qc.setQueryData<Message[]>(["messages", cid], (prev) =>
        prev?.map((message) =>
          payload.messageIds!.includes(message._id)
            ? {
                ...message,
                status: payload.status,
                deliveredAt: payload.deliveredAt ?? message.deliveredAt,
                readAt: payload.readAt ?? message.readAt,
              }
            : message,
        ),
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message:new", onNew);
    socket.on("message:status", onStatus);
    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onNew);
      socket.off("message:status", onStatus);
    };
  }, [conversationId, qc]);
};

/** Upload a file (image/audio) and return its URL. */
export const uploadFile = async (
  file: File | Blob,
  filename = "voice-note.webm",
): Promise<string> => {
  const fd = new FormData();
  const f =
    file instanceof File
      ? file
      : new File([file], filename, { type: file.type });
  fd.append("file", f);
  const { data } = await api.post("/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const d = data as {
    url?: string;
    data?: { url?: string };
    secure_url?: string;
  };
  return d.url ?? d.data?.url ?? d.secure_url ?? "";
};
