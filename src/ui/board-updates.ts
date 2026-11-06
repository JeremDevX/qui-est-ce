const queuedCard = '.suspect-card[data-will-fold]';

/** Keeps the cards mounted so a snapshot never restarts an ongoing fold. */
export class BoardUpdates {
  private view: HTMLElement;
  private settled: () => void;
  private folding: Animation | null = null;

  constructor(view: HTMLElement, settled: () => void) {
    this.view = view;
    this.settled = settled;
  }

  get animating(): boolean { return this.folding !== null; }

  render(markup: string, retainCards: boolean): void {
    if (retainCards && this.patch(markup)) {
      this.foldNext();
    } else {
      this.folding = null;
      this.view.innerHTML = markup;
    }
  }

  private patch(markup: string): boolean {
    const next = this.view.ownerDocument.createElement('template');
    next.innerHTML = markup;
    const cards = [...this.view.querySelectorAll<HTMLButtonElement>('.suspect-card')];
    const incoming = [...next.content.querySelectorAll<HTMLButtonElement>('.suspect-card')];
    const board = this.view.querySelector('.board-panel');
    const nextBoard = next.content.querySelector('.board-panel');
    if (!board || !nextBoard || cards.length !== incoming.length
      || cards.some((card, index) => card.dataset.character !== incoming[index]?.dataset.character)) return false;

    this.view.querySelector('.notice')?.remove();
    const notice = next.content.querySelector('.notice');
    if (notice) this.view.prepend(notice);
    for (const region of ['.game-hud', '.skip-actions', '.board-heading', '.control-deck']) {
      const replacement = next.content.querySelector(region);
      if (replacement) this.view.querySelector(region)?.replaceWith(replacement);
    }
    board.toggleAttribute('data-guessing', nextBoard.hasAttribute('data-guessing'));

    incoming.forEach((source, index) => {
      const card = cards[index];
      const state = source.dataset.state;
      if (!card || !state) return;
      card.setAttribute('aria-label', source.getAttribute('aria-label') ?? '');
      const willFold = card.dataset.state === 'up' && state === 'down';
      card.toggleAttribute('data-will-fold', willFold);
      if (willFold) return;
      if (card.classList.contains('is-folding')) {
        card.classList.remove('is-folding');
        this.folding = null;
      }
      if (card.dataset.state === state) return;
      card.dataset.state = state;
      const mark = card.querySelector('.fold-mark');
      if (mark) mark.textContent = state === 'revealed' ? '★' : '×';
    });
    return true;
  }

  private foldNext(): void {
    if (this.folding) return;
    const card = this.view.querySelector<HTMLButtonElement>(queuedCard);
    if (!card) return;
    card.classList.add('is-folding');
    const animation = card.querySelector('.card-face')?.getAnimations()[0];
    if (!animation) {
      card.classList.remove('is-folding');
      for (const waiting of this.view.querySelectorAll<HTMLButtonElement>(queuedCard)) this.fold(waiting);
      return;
    }
    this.folding = animation;
    const finish = (): void => {
      if (this.folding !== animation) return;
      this.folding = null;
      this.fold(card);
      card.classList.remove('is-folding');
      this.foldNext();
      if (!this.folding) this.settled();
    };
    void animation.finished.then(finish, finish);
  }

  private fold(card: HTMLButtonElement): void {
    card.dataset.state = 'down';
    card.removeAttribute('data-will-fold');
  }
}
