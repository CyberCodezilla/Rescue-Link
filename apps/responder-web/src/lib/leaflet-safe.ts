import L from 'leaflet';

/**
 * Defensive runtime monkey-patches for Leaflet in Next.js SPA / React environments.
 * Prevents "Cannot read properties of undefined (reading '_leaflet_pos')" when markers,
 * popups, or map panes are animated during route transitions, component unmounts,
 * or concurrent flyTo/panTo animations.
 */
if (typeof window !== 'undefined' && L) {
  if (L.DomUtil) {
    const origGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: HTMLElement | any): L.Point {
      if (!el || typeof el !== 'object') {
        return new L.Point(0, 0);
      }
      try {
        const pos = origGetPosition.call(L.DomUtil, el);
        return pos || new L.Point(0, 0);
      } catch {
        return (el && el._leaflet_pos) || new L.Point(0, 0);
      }
    };

    const origSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: HTMLElement | any, point: L.Point): void {
      if (!el || typeof el !== 'object') return;
      try {
        origSetPosition.call(L.DomUtil, el, point);
      } catch {
        try {
          el._leaflet_pos = point;
        } catch {
          // ignore detached node mutation error
        }
      }
    };
  }

  if (L.Map && L.Map.prototype) {
    const origGetMapPanePos = (L.Map.prototype as any)._getMapPanePos;
    if (typeof origGetMapPanePos === 'function') {
      (L.Map.prototype as any)._getMapPanePos = function (): L.Point {
        if (!(this as any)._mapPane) return new L.Point(0, 0);
        try {
          return origGetMapPanePos.call(this) || new L.Point(0, 0);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }
  }

  if (L.PosAnimation && L.PosAnimation.prototype) {
    const origRun = L.PosAnimation.prototype.run;
    L.PosAnimation.prototype.run = function (el: any, newPos: any, duration: any, easeLinearity: any) {
      if (!el) return this;
      try {
        return origRun.call(this, el, newPos, duration, easeLinearity);
      } catch {
        return this;
      }
    };
  }

  if (L.Popup && L.Popup.prototype) {
    const origAnimateZoom = (L.Popup.prototype as any)._animateZoom;
    if (typeof origAnimateZoom === 'function') {
      (L.Popup.prototype as any)._animateZoom = function (opt: any) {
        if (!(this as any)._container || !(this as any)._map) return;
        try {
          origAnimateZoom.call(this, opt);
        } catch {
          // ignore
        }
      };
    }
  }

  if (L.Marker && L.Marker.prototype) {
    const origMarkerAnimateZoom = (L.Marker.prototype as any)._animateZoom;
    if (typeof origMarkerAnimateZoom === 'function') {
      (L.Marker.prototype as any)._animateZoom = function (opt: any) {
        if (!(this as any)._map || !(this as any)._icon) return;
        try {
          origMarkerAnimateZoom.call(this, opt);
        } catch {
          // ignore
        }
      };
    }
  }
}

export default L;
