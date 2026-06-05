import { AsyncQueue } from '../src/queue';

describe('AsyncQueue', () => {
  it('deve executar tarefas sequencialmente (controle de concorrência estrito)', async () => {
    const queue = new AsyncQueue();
    const order: number[] = [];
    
    const createTask = (id: number, delayMs: number) => {
      return queue.enqueue(async () => {
        await new Promise(res => setTimeout(res, delayMs));
        order.push(id);
      });
    };

    // Disparamos 5 chamadas simultâneas com tempos de resolução variados.
    // Se elas rodassem em paralelo, a de 10ms (id 2) terminaria antes da de 50ms (id 1).
    // Como a fila funciona como um Mutex, a ordem de terminação DEVE ser estritamente 1, 2, 3, 4, 5.
    const promises = [
      createTask(1, 50),
      createTask(2, 10),
      createTask(3, 40),
      createTask(4, 20),
      createTask(5, 30)
    ];

    await Promise.all(promises);

    expect(order).toEqual([1, 2, 3, 4, 5]);
  });

  it('deve rejeitar e repassar o erro corretamente mantendo a fila funcionando', async () => {
    const queue = new AsyncQueue();
    let task2Completed = false;

    const task1 = queue.enqueue(async () => {
      throw new Error('Task 1 failed');
    });

    const task2 = queue.enqueue(async () => {
      task2Completed = true;
      return 'Task 2 success';
    });

    await expect(task1).rejects.toThrow('Task 1 failed');
    await expect(task2).resolves.toBe('Task 2 success');
    expect(task2Completed).toBe(true);
  });
});
