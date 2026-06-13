/**
 * Fila assíncrona simples para garantir a execução sequencial de tarefas.
 * Funciona como um Mutex (Mutual Exclusion) mantendo um array de promessas
 * que são resolvidas estritamente em ordem de entrada. Isso é essencial
 * para respeitar o limite de conexões simultâneas da API da Sascar.
 */
export declare class AsyncQueue {
    private queue;
    private isProcessing;
    /**
     * Adiciona uma nova tarefa assíncrona na fila.
     * @param task Função que retorna a Promise a ser executada.
     * @returns Uma Promise que será resolvida quando a tarefa for concluída, com o retorno tipado.
     */
    enqueue<T>(task: () => Promise<T>): Promise<T>;
    /**
     * Método interno para processamento recursivo/sequencial da fila.
     * A trava `isProcessing` garante que apenas um loop consuma a fila por vez.
     */
    private processQueue;
}
