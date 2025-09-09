import { Index } from "@upstash/vector";
import { ConversationSession, ConversationMessage } from "./types.js";

export class ConversationMemory {
  private vector: Index;
  private readonly namespace = "context7_conversations";
  private readonly maxMessagesPerSession = 50; // Limit to prevent memory bloat
  private readonly sessionExpiryMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    // Initialize Vector client with existing environment variables
    const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
    const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!vectorUrl || !vectorToken) {
      throw new Error("Upstash Vector credentials not found in environment variables");
    }

    this.vector = new Index({
      url: vectorUrl,
      token: vectorToken,
    });
  }

  /**
   * Generate a simple embedding for text (1536 dimensions to match your Vector DB)
   */
  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding (1536 dimensions to match your Vector DB)
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 1536] += charCode / 1000; // Normalize
    }
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Save or update a conversation session
   */
  async saveConversation(sessionId: string, messages: ConversationMessage[], metadata?: any): Promise<void> {
    try {
      // Limit the number of messages to prevent memory bloat
      const limitedMessages = messages.slice(-this.maxMessagesPerSession);
      
      const session: ConversationSession = {
        sessionId,
        messages: limitedMessages,
        lastUpdated: Date.now(),
        metadata,
      };

      // Create text representation for embedding
      const sessionText = `Session: ${sessionId} Messages: ${limitedMessages.map(m => `${m.role}: ${m.content}`).join(' ')}`;
      const embedding = this.generateSimpleEmbedding(sessionText);

      // Store in vector database
      await this.vector.upsert([{
        id: sessionId,
        vector: embedding,
        metadata: {
          type: "conversation_session",
          session: JSON.stringify(session),
          lastUpdated: Date.now(),
          namespace: this.namespace,
        },
      }]);
    } catch (error) {
      console.error("Error saving conversation:", error);
      throw error;
    }
  }

  /**
   * Retrieve a conversation session
   */
  async getConversation(sessionId: string): Promise<ConversationSession | null> {
    try {
      const results = await this.vector.fetch([sessionId], {
        includeMetadata: true,
      });
      
      if (!results || results.length === 0 || !results[0]) {
        return null;
      }

      const record = results[0];
      if (!record.metadata?.session) {
        return null;
      }

      // Check if session has expired
      const lastUpdated = record.metadata.lastUpdated as number || 0;
      if (Date.now() - lastUpdated > this.sessionExpiryMs) {
        // Session expired, delete it
        await this.deleteConversation(sessionId);
        return null;
      }

      return JSON.parse(record.metadata.session as string) as ConversationSession;
    } catch (error) {
      console.error("Error retrieving conversation:", error);
      return null;
    }
  }

  /**
   * Add a message to an existing conversation
   */
  async addMessage(sessionId: string, message: ConversationMessage, metadata?: any): Promise<void> {
    try {
      const existingSession = await this.getConversation(sessionId);
      
      const messages = existingSession ? existingSession.messages : [];
      messages.push(message);
      
      const combinedMetadata = {
        ...existingSession?.metadata,
        ...metadata,
      };

      await this.saveConversation(sessionId, messages, combinedMetadata);
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }

  /**
   * Get recent conversation context for Context7 queries
   */
  async getRecentContext(sessionId: string, maxMessages: number = 10): Promise<string> {
    try {
      const session = await this.getConversation(sessionId);
      
      if (!session || !session.messages.length) {
        return "";
      }

      // Get the most recent messages
      const recentMessages = session.messages.slice(-maxMessages);
      
      // Format for Context7 consumption
      const contextLines = recentMessages.map(msg => {
        const timestamp = new Date(msg.timestamp).toISOString();
        return `[${timestamp}] ${msg.role}: ${msg.content}`;
      });

      return `Previous conversation context:\n${contextLines.join('\n')}\n\n`;
    } catch (error) {
      console.error("Error getting recent context:", error);
      return "";
    }
  }

  /**
   * Search conversations by content (basic text search)
   */
  async searchConversations(sessionId: string, searchTerm: string): Promise<ConversationMessage[]> {
    try {
      const session = await this.getConversation(sessionId);
      
      if (!session) {
        return [];
      }

      return session.messages.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching conversations:", error);
      return [];
    }
  }

  /**
   * Delete a conversation session
   */
  async deleteConversation(sessionId: string): Promise<void> {
    try {
      await this.vector.delete([sessionId]);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(sessionId: string): Promise<{
    messageCount: number;
    lastActivity: number;
    sessionAge: number;
  } | null> {
    try {
      const session = await this.getConversation(sessionId);
      
      if (!session) {
        return null;
      }

      return {
        messageCount: session.messages.length,
        lastActivity: session.lastUpdated,
        sessionAge: Date.now() - (session.messages[0]?.timestamp || session.lastUpdated),
      };
    } catch (error) {
      console.error("Error getting conversation stats:", error);
      return null;
    }
  }
}