/**
 * Streaming Handler - Server-Sent Events formatting
 */

export interface StreamEvent {
  type: 'content' | 'error' | 'done' | 'metadata';
  content?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class StreamHandler {
  /**
   * Stream LLM response to client with SSE formatting
   */
  async streamToClient(
    stream: ReadableStream,
    writer: WritableStreamDefaultWriter
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Send done event
          await this.writeEvent(writer, { type: 'done' });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = this.parseSSE(line);
          if (parsed.content) {
            await this.writeEvent(writer, {
              type: 'content',
              content: parsed.content,
            });
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      await this.writeEvent(writer, {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      await writer.close();
    }
  }

  /**
   * Create a Response with streaming SSE
   */
  async createStreamResponse(
    llmResponse: Response,
    onComplete?: (fullText: string) => void
  ): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Process stream in background
    this.processStream(llmResponse, writer, onComplete).catch(error => {
      console.error('Stream processing error:', error);
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  }

  /**
   * Process LLM stream and write to client
   */
  private async processStream(
    llmResponse: Response,
    writer: WritableStreamDefaultWriter,
    onComplete?: (fullText: string) => void
  ): Promise<void> {
    const reader = llmResponse.body?.getReader();
    if (!reader) {
      await this.writeEvent(writer, {
        type: 'error',
        error: 'No response body',
      });
      await writer.close();
      return;
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const content = this.extractContent(line);
          if (content) {
            fullText += content;
            await this.writeEvent(writer, {
              type: 'content',
              content,
            });
          }
        }
      }

      // Send completion event
      await this.writeEvent(writer, {
        type: 'done',
        metadata: { length: fullText.length },
      });

      // Call completion callback
      if (onComplete) {
        onComplete(fullText);
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      await this.writeEvent(writer, {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      await writer.close();
    }
  }

  /**
   * Write SSE event to stream
   */
  private async writeEvent(
    writer: WritableStreamDefaultWriter,
    event: StreamEvent
  ): Promise<void> {
    const data = JSON.stringify(event);
    const message = `data: ${data}\n\n`;
    await writer.write(new TextEncoder().encode(message));
  }

  /**
   * Parse SSE line
   */
  private parseSSE(line: string): { content?: string } {
    if (!line.startsWith('data: ')) {
      return {};
    }

    try {
      const data = line.slice(6);
      if (data === '[DONE]') {
        return {};
      }

      const parsed = JSON.parse(data);
      return { content: parsed.content || parsed.text || '' };
    } catch {
      return {};
    }
  }

  /**
   * Extract content from various LLM response formats
   */
  private extractContent(line: string): string {
    if (!line.startsWith('data: ')) {
      return '';
    }

    try {
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) {
        return '';
      }

      const parsed = JSON.parse(data);

      // Claude format
      if (parsed.type === 'content_block_delta') {
        return parsed.delta?.text || '';
      }

      // OpenAI format
      if (parsed.choices?.[0]?.delta?.content) {
        return parsed.choices[0].delta.content;
      }

      // Generic format
      if (parsed.content) {
        return parsed.content;
      }

      // Plain text (Workers AI)
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      // If not JSON, might be plain text
      const data = line.slice(6).trim();
      if (data && data !== '[DONE]') {
        return data;
      }
    }

    return '';
  }

  /**
   * Create a simple text stream for non-SSE clients
   */
  async createTextStream(llmResponse: Response): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const reader = llmResponse.body?.getReader();
    if (!reader) {
      await writer.close();
      return new Response(readable);
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Process in background
    (async () => {
      try {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const content = this.extractContent(line);
            if (content) {
              await writer.write(encoder.encode(content));
            }
          }
        }
      } catch (error) {
        console.error('Text stream error:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}
