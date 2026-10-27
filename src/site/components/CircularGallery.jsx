import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function wrapIndex(index, itemCount) {
  return (index + itemCount) % itemCount;
}

export default function CircularGallery({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const dialogRef = useRef(null);
  const dragStart = useRef(null);
  const wasDragged = useRef(false);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    if (!expandedItem) {
      return undefined;
    }

    const dialog = dialogRef.current;
    if (typeof dialog?.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog?.setAttribute('open', '');
    }

    return () => {
      if (dialog?.open && typeof dialog.close === 'function') {
        dialog.close();
      }
    };
  }, [expandedItem]);

  if (!items.length) {
    return null;
  }

  const activeItem = items[activeIndex];
  const changeActive = (step) => {
    setActiveIndex((index) => wrapIndex(index + step, items.length));
  };

  const handleWheel = (event) => {
    const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
    if (Math.abs(horizontalDelta) < 20 || Date.now() - lastWheelTime.current < 450) {
      return;
    }

    lastWheelTime.current = Date.now();
    changeActive(horizontalDelta > 0 ? 1 : -1);
  };

  const handlePointerDown = (event) => {
    if (event.target.closest('.target-gallery-control')) {
      return;
    }

    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event) => {
    if (dragStart.current === null) {
      return;
    }

    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) < 45) {
      return;
    }

    wasDragged.current = true;
    changeActive(distance < 0 ? 1 : -1);
    window.setTimeout(() => {
      wasDragged.current = false;
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeActive(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      changeActive(1);
    }
  };

  return (
    <div
      className="target-gallery"
      role="region"
      aria-label="Green Bangkok 2030 targets"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className="target-gallery-viewport"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        {items.map((item, index) => {
          const offset = (
            ((index - activeIndex + items.length / 2) % items.length + items.length) % items.length
          ) - items.length / 2;
          const isActive = index === activeIndex;

          return (
            <button
              className={`target-gallery-slide${isActive ? ' is-active' : ''}`}
              key={item.label}
              type="button"
              aria-label={`Open full image: ${item.value}${item.unit ? ` ${item.unit}` : ''}, ${item.label}`}
              aria-pressed={isActive}
              onClick={() => {
                if (wasDragged.current) {
                  wasDragged.current = false;
                  return;
                }
                setActiveIndex(index);
                setExpandedItem(item);
              }}
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 100}%) translateZ(${-Math.abs(offset) * 90}px) rotateY(${-offset * 28}deg) scale(${isActive ? 1 : 0.86})`,
                zIndex: items.length - Math.abs(offset),
              }}
            >
              <img src={item.image} alt="" draggable="false" />
              <span className="target-gallery-caption">
                <strong>{item.value}{item.unit && <small> {item.unit}</small>}</strong>
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="target-gallery-controls">
        <button className="target-gallery-control" type="button" onClick={() => changeActive(-1)}>
          <ChevronLeft size={18} aria-hidden="true" />
          Previous target
        </button>
        <p aria-live="polite">
          Target {activeIndex + 1} of {items.length}: {activeItem.label}
        </p>
        <button className="target-gallery-control" type="button" onClick={() => changeActive(1)}>
          Next target
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      {expandedItem && (
        <dialog
          className="target-gallery-lightbox"
          ref={dialogRef}
          aria-label={`Full image: ${expandedItem.value}${expandedItem.unit ? ` ${expandedItem.unit}` : ''}, ${expandedItem.label}`}
          onClose={() => setExpandedItem(null)}
          onCancel={() => setExpandedItem(null)}
        >
          <button
            className="target-gallery-lightbox-close"
            type="button"
            aria-label="Close full-size image"
            onClick={() => {
              const dialog = dialogRef.current;
              if (dialog?.open && typeof dialog.close === 'function') {
                dialog.close();
              } else {
                setExpandedItem(null);
              }
            }}
          >
            Close
          </button>
          <img
            src={expandedItem.image}
            alt={`${expandedItem.value}${expandedItem.unit ? ` ${expandedItem.unit}` : ''}: ${expandedItem.label}`}
          />
        </dialog>
      )}
    </div>
  );
}
