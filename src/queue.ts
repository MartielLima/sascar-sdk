/**
 * Fila assíncrona simples para garantir a execução sequencial de tarefas.
 * Funciona como um Mutex (Mutual Exclusion) mantendo um array de promessas
 * que são resolvidas estritamente em ordem de entrada. Isso é essencial
 * para respeitar o limite de conexões simultâneas da API da Sascar.
 */
export class AsyncQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  /**
   * Adiciona uma nova tarefa assíncrona na fila.
   * @param task Função que retorna a Promise a ser executada.
   * @returns Uma Promise que será resolvida quando a tarefa for concluída, com o retorno tipado.
   */
  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  /**
   * Método interno para processamento recursivo/sequencial da fila.
   * A trava `isProcessing` garante que apenas um loop consuma a fila por vez.
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.isProcessing = false;
  }
}
