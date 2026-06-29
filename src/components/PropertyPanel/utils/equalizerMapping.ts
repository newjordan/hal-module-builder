export type AnySettings = Record<string, any>;

// Map SRP-style updates to legacy layer.equalizerSettings shape while keeping both keys in sync
export function adaptSrpToLegacy(updates: AnySettings): AnySettings {
  const out: AnySettings = { ...updates };

  // Keep alignment keys in sync for both UIs
  if (Object.prototype.hasOwnProperty.call(updates, 'barAlignment')) {
    out.blockAlignment = updates.barAlignment;
  }
  if (
    Object.prototype.hasOwnProperty.call(updates, 'blockAlignment') &&
    !Object.prototype.hasOwnProperty.call(updates, 'barAlignment')
  ) {
    out.barAlignment = updates.blockAlignment;
  }

  // Keep invert flags in sync with correct precedence.
  // IMPORTANT: 'updates' may be a merged object (existing layer settings + SRP changes).
  // If 'invert' is present, it must win over any stale 'invertDirection' from the merged object.
  const hasInvert = Object.prototype.hasOwnProperty.call(updates, 'invert');
  const hasInvertDirection = Object.prototype.hasOwnProperty.call(
    updates,
    'invertDirection'
  );

  if (hasInvert) {
    out.invert = Boolean(updates.invert);
    out.invertDirection = Boolean(updates.invert);
  } else if (hasInvertDirection) {
    out.invert = Boolean(updates.invertDirection);
    out.invertDirection = Boolean(updates.invertDirection);
  }

  try {
    if (hasInvert || hasInvertDirection) {
      console.debug('[Mapping][adaptSrpToLegacy] invert sync', {
        incoming: hasInvert ? updates.invert : updates.invertDirection,
        outgoing: out.invert,
        outgoingInvertDirection: out.invertDirection,
      });
    }
  } catch {}

  // Drop deprecated/legacy-only or internal fields we don't want to persist
  if (Object.prototype.hasOwnProperty.call(out, 'radialSizingMode')) {
    delete out.radialSizingMode; // fully remove legacy width mode from writes
  }

  return out;
}

// Optionally map legacy settings into SRP initial state while keeping compatibility
export function adaptLegacyToSrp(settings: AnySettings): AnySettings {
  const out: AnySettings = { ...settings };

  // Prefer barAlignment but mirror blockAlignment if present only there
  if (
    !Object.prototype.hasOwnProperty.call(out, 'barAlignment') &&
    Object.prototype.hasOwnProperty.call(out, 'blockAlignment')
  ) {
    out.barAlignment = out.blockAlignment;
  }

  // Prefer invertDirection but mirror from invert if needed
  if (
    !Object.prototype.hasOwnProperty.call(out, 'invertDirection') &&
    Object.prototype.hasOwnProperty.call(out, 'invert')
  ) {
    out.invertDirection = Boolean(out.invert);
  }

  return out;
}
