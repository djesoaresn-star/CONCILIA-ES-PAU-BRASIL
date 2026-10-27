import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface TopSyncedScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  topBarClassName?: string;
  stickyTop?: boolean;
}

/**
 * Container com barra de rolagem horizontal sincronizada no topo e na base,
 * além de botões rápidos de deslocamento lateral para tabelas largas.
 */
export const TopSyncedScrollContainer: React.FC<TopSyncedScrollContainerProps> = ({
  children,
  className = '',
  topBarClassName = '',
  stickyTop = true,
}) => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const syncingSourceRef = useRef<'top' | 'body' | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateMetrics = useCallback(() => {
    const bodyEl = bodyScrollRef.current;
    if (!bodyEl) return;

    const firstChild = bodyEl.firstElementChild as HTMLElement | null;
    const measuredScrollWidth = Math.max(
      bodyEl.scrollWidth,
      firstChild ? firstChild.scrollWidth : 0
    );
    const clientWidth = bodyEl.clientWidth;

    if (spacerRef.current) {
      spacerRef.current.style.width = `${measuredScrollWidth}px`;
    }

    const overflow = measuredScrollWidth > clientWidth + 2;
    setHasOverflow(overflow);

    const currentScrollLeft = bodyEl.scrollLeft;
    setCanScrollLeft(currentScrollLeft > 2);
    setCanScrollRight(currentScrollLeft + clientWidth < measuredScrollWidth - 2);

    if (topScrollRef.current && Math.abs(topScrollRef.current.scrollLeft - currentScrollLeft) > 1) {
      topScrollRef.current.scrollLeft = currentScrollLeft;
    }
  }, []);

  useEffect(() => {
    updateMetrics();

    const bodyEl = bodyScrollRef.current;
    const firstChild = bodyEl?.firstElementChild as HTMLElement | null;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateMetrics();
      });
      if (bodyEl) resizeObserver.observe(bodyEl);
      if (firstChild) resizeObserver.observe(firstChild);
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && bodyEl) {
      mutationObserver = new MutationObserver(() => {
        updateMetrics();
      });
      mutationObserver.observe(bodyEl, { childList: true, subtree: true });
    }

    window.addEventListener('resize', updateMetrics);
    const initialTimer = window.setTimeout(updateMetrics, 120);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      window.removeEventListener('resize', updateMetrics);
      window.clearTimeout(initialTimer);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateMetrics, children]);

  const handleTopScroll = () => {
    if (syncingSourceRef.current === 'body') return;
    const topEl = topScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!topEl || !bodyEl) return;

    syncingSourceRef.current = 'top';
    bodyEl.scrollLeft = topEl.scrollLeft;

    const maxScroll = Math.max(0, bodyEl.scrollWidth - bodyEl.clientWidth);
    setCanScrollLeft(bodyEl.scrollLeft > 2);
    setCanScrollRight(bodyEl.scrollLeft < maxScroll - 2);

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      syncingSourceRef.current = null;
    });
  };

  const handleBodyScroll = () => {
    if (syncingSourceRef.current === 'top') return;
    const topEl = topScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!bodyEl) return;

    syncingSourceRef.current = 'body';
    if (topEl) {
      topEl.scrollLeft = bodyEl.scrollLeft;
    }

    const maxScroll = Math.max(0, bodyEl.scrollWidth - bodyEl.clientWidth);
    setCanScrollLeft(bodyEl.scrollLeft > 2);
    setCanScrollRight(bodyEl.scrollLeft < maxScroll - 2);

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      syncingSourceRef.current = null;
    });
  };

  const scrollByOffset = (delta: number, toEdge?: 'start' | 'end') => {
    const bodyEl = bodyScrollRef.current;
    if (!bodyEl) return;

    const targetLeft =
      toEdge === 'start'
        ? 0
        : toEdge === 'end'
        ? bodyEl.scrollWidth
        : bodyEl.scrollLeft + delta;

    bodyEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* Barra de rolagem horizontal superior (visível acima do cabeçalho da tabela quando há largura excedente) */}
      <div
        className={`${
          hasOverflow ? 'flex' : 'hidden'
        } items-center gap-2 px-3 py-1.5 bg-slate-100/95 backdrop-blur-xs border border-slate-200 rounded-t-lg ${
          stickyTop ? 'sticky top-0 z-20 shadow-2xs' : ''
        } ${topBarClassName}`}
      >
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-600 shrink-0 select-none">
          <MoveHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Mover tabela:</span>
        </div>

        <button
          type="button"
          onClick={(e) => scrollByOffset(-380, e.shiftKey ? 'start' : undefined)}
          disabled={!canScrollLeft}
          title="Mover tabela para a esquerda (Shift+Clique para ir ao início)"
          className="p-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shrink-0 shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="top-table-scrollbar flex-1 overflow-x-scroll overflow-y-hidden h-3.5 rounded-full"
          aria-label="Barra de rolagem horizontal superior da tabela"
        >
          <div ref={spacerRef} className="h-1" />
        </div>

        <button
          type="button"
          onClick={(e) => scrollByOffset(380, e.shiftKey ? 'end' : undefined)}
          disabled={!canScrollRight}
          title="Mover tabela para a direita (Shift+Clique para ir ao final)"
          className="p-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shrink-0 shadow-2xs"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container principal da tabela sincronizado */}
      <div
        ref={bodyScrollRef}
        onScroll={handleBodyScroll}
        className={`w-full overflow-x-auto ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
