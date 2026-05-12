// ============================================================================
// SIKESUMA Tier 5a Phase 2.4 + 2.5 — Submit Flow Helpers Test Suite
// ============================================================================
// File          : utils/submitRevisiHelpers.test.ts
// Tier/Phase    : Tier 5a — Phase 2.4 (Submit flow UI integration) + Phase 2.5
//                 (LHR APIP R3c persistence + banner)
// Covers        : collectChangedRowsWithSection + summarizeChangedRows +
//                 executeSubmitRevisiPOK (orchestrator) + shouldShowLhrApipBanner
//                 + deriveLhrApipForSubmission (Phase 2.5)
// ============================================================================

import { describe, expect, it } from 'vitest';
import type { PaguRow, PaguSection } from '../types';
import {
  collectChangedRowsWithSection,
  summarizeChangedRows,
  shouldShowLhrApipBanner,
  deriveLhrApipForSubmission,
  type LhrApipGlobalState,
} from './submitRevisiHelpers';

/** Helper: build PaguRow dengan default + override. */
function makeRow(over: Partial<PaguRow>): PaguRow {
  return {
    id: 'row-x',
    kode: '521115',
    description: 'Belanja Barang Operasional',
    volume: 1,
    satuan: 'paket',
    hargaSatuanAwal: 1_000_000,
    hargaSatuanRevisi: 0,
    jumlahBiayaAwal: 1_000_000,
    jumlahBiayaRevisi: 1_000_000, // post-TD fix: effective
    sumberDana: 'RM',
    level: 1,
    ...over,
  };
}

/** Helper: build PaguSection dari array rows. */
function makeSection(id: string, title: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2026, title, rows };
}

// ─── collectChangedRowsWithSection ─────────────────────────────────────────

describe('collectChangedRowsWithSection', () => {
  it('returns empty array kalau tidak ada section', () => {
    expect(collectChangedRowsWithSection([])).toEqual([]);
  });

  it('returns empty array kalau section ada tapi tidak ada row', () => {
    const sections: PaguSection[] = [makeSection('pagu-2026-a', 'Section A', [])];
    expect(collectChangedRowsWithSection(sections)).toEqual([]);
  });

  it('returns empty array kalau tidak ada row yang berubah (semua hsr=0 fallback)', () => {
    // Konteks 1 fallback: hsr=0 → effective revisi = effective awal → NOT changed
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({ id: 'r1', hargaSatuanRevisi: 0 }),
        makeRow({ id: 'r2', hargaSatuanRevisi: 0 }),
      ]),
    ];
    expect(collectChangedRowsWithSection(sections)).toEqual([]);
  });

  it('detect 1 row berubah dalam 1 section', () => {
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r1',
          kode: '521115',
          description: 'ATK',
          volume: 2,
          hargaSatuanAwal: 500_000,
          hargaSatuanRevisi: 600_000,
          jumlahBiayaAwal: 1_000_000,
          jumlahBiayaRevisi: 1_200_000,
        }),
        // unchanged
        makeRow({ id: 'r2', hargaSatuanRevisi: 0 }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result).toHaveLength(1);
    expect(result[0].pagu_row_id).toBe('r1');
    expect(result[0].section_id).toBe('pagu-2026-a');
    expect(result[0].perubahanData).toEqual({
      kode: '521115',
      description: 'ATK',
      nilai_semula: 1_000_000,
      nilai_revisi: 1_200_000,
      section_id: 'pagu-2026-a',
    });
  });

  it('detect multiple changed rows across multiple sections (preserves order)', () => {
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r-a1',
          jumlahBiayaAwal: 1_000_000,
          hargaSatuanRevisi: 600_000,
          volume: 2,
          jumlahBiayaRevisi: 1_200_000,
        }),
        makeRow({ id: 'r-a2', hargaSatuanRevisi: 0 }), // unchanged
      ]),
      makeSection('pagu-2026-b', 'Section B', [
        makeRow({
          id: 'r-b1',
          jumlahBiayaAwal: 2_000_000,
          hargaSatuanRevisi: 1_500_000,
          volume: 1,
          jumlahBiayaRevisi: 1_500_000,
        }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result.map((e) => e.pagu_row_id)).toEqual(['r-a1', 'r-b1']);
    expect(result[0].section_id).toBe('pagu-2026-a');
    expect(result[1].section_id).toBe('pagu-2026-b');
  });

  it('use raw jumlahBiaya* (post-TD fix = effective values)', () => {
    // Verifikasi nilai_semula + nilai_revisi pakai stored values langsung,
    // bukan re-compute (volume × harga). Mirror Recipe A di handover doc.
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r1',
          volume: 3,
          hargaSatuanAwal: 100_000,
          hargaSatuanRevisi: 110_000,
          jumlahBiayaAwal: 300_000,
          jumlahBiayaRevisi: 330_000,
        }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result[0].perubahanData.nilai_semula).toBe(300_000);
    expect(result[0].perubahanData.nilai_revisi).toBe(330_000);
  });

  it('handle missing jumlahBiaya* gracefully (nullish coalesce ke 0)', () => {
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        // Edge case: hsa>0, hsr>0 -- changed via harga; raw jumlah field
        // mungkin 0 saat row freshly imported sebelum TD fix migrate.
        // Helper should default to 0.
        makeRow({
          id: 'r1',
          volume: 2,
          hargaSatuanAwal: 500_000,
          hargaSatuanRevisi: 600_000,
          jumlahBiayaAwal: 1_000_000,
          jumlahBiayaRevisi: undefined as unknown as number,
        }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result[0].perubahanData.nilai_revisi).toBe(0);
  });

  it('detect changed row meskipun volume = 0 kalau price differs (edge)', () => {
    // volume=0 → effective awal = 0, effective revisi = 0. isChangedRow = false.
    // Confirmed by helpers.ts isChangedRow + EPSILON.
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r1',
          volume: 0,
          hargaSatuanAwal: 100_000,
          hargaSatuanRevisi: 200_000,
          jumlahBiayaAwal: 0,
          jumlahBiayaRevisi: 0,
        }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result).toEqual([]);
  });

  it('include parent rows kalau effective values changed (regardless level)', () => {
    // Comment di helper: "Tidak filter leaf vs parent — Itjenad audit prefer
    // semua entries". Confirm test.
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r-parent',
          level: 0,
          volume: 1,
          hargaSatuanAwal: 1_000_000,
          hargaSatuanRevisi: 1_500_000,
          jumlahBiayaAwal: 1_000_000,
          jumlahBiayaRevisi: 1_500_000,
        }),
        makeRow({
          id: 'r-leaf',
          level: 1,
          volume: 1,
          hargaSatuanAwal: 1_000_000,
          hargaSatuanRevisi: 1_500_000,
          jumlahBiayaAwal: 1_000_000,
          jumlahBiayaRevisi: 1_500_000,
        }),
      ]),
    ];
    const result = collectChangedRowsWithSection(sections);
    expect(result.map((e) => e.pagu_row_id)).toEqual(['r-parent', 'r-leaf']);
  });
});

// ─── summarizeChangedRows ──────────────────────────────────────────────────

describe('summarizeChangedRows', () => {
  it('empty entries → "0 row berubah di 0 section"', () => {
    expect(summarizeChangedRows([])).toBe('0 row berubah di 0 section');
  });

  it('1 row 1 section', () => {
    expect(
      summarizeChangedRows([
        {
          section_id: 's1',
          pagu_row_id: 'r1',
          perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
        },
      ])
    ).toBe('1 row berubah di 1 section');
  });

  it('multi rows same section', () => {
    const entries = [
      {
        section_id: 's1',
        pagu_row_id: 'r1',
        perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
      },
      {
        section_id: 's1',
        pagu_row_id: 'r2',
        perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
      },
    ];
    expect(summarizeChangedRows(entries)).toBe('2 row berubah di 1 section');
  });

  it('multi rows multi section', () => {
    const entries = [
      {
        section_id: 's1',
        pagu_row_id: 'r1',
        perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
      },
      {
        section_id: 's2',
        pagu_row_id: 'r2',
        perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
      },
      {
        section_id: 's2',
        pagu_row_id: 'r3',
        perubahanData: { kode: '521115', nilai_semula: 1, nilai_revisi: 2 },
      },
    ];
    expect(summarizeChangedRows(entries)).toBe('3 row berubah di 2 section');
  });
});

// ─── executeSubmitRevisiPOK orchestrator ───────────────────────────────────

import { executeSubmitRevisiPOK, type SubmitRevisiServices } from './submitRevisiHelpers';
import { vi } from 'vitest';

/** Default sections dengan 1 row changed di 1 section — happy path baseline. */
function defaultSectionsWithOneChange(): PaguSection[] {
  return [
    makeSection('pagu-2026-a', 'Section A', [
      makeRow({
        id: 'r1',
        volume: 2,
        hargaSatuanAwal: 500_000,
        hargaSatuanRevisi: 600_000,
        jumlahBiayaAwal: 1_000_000,
        jumlahBiayaRevisi: 1_200_000,
      }),
    ]),
  ];
}

/** Build mock services dengan defaults dan optional overrides. */
function mockServices(over: Partial<SubmitRevisiServices> = {}): SubmitRevisiServices {
  return {
    createUsulanDraft: vi.fn().mockResolvedValue({ id: 'usulan-1' }),
    addPerubahan: vi.fn().mockResolvedValue({}),
    recordValidationAttempt: vi.fn().mockResolvedValue({}),
    transitionUsulan: vi.fn().mockResolvedValue({ result: { allowed: true } }),
    ...over,
  };
}

describe('executeSubmitRevisiPOK', () => {
  it('happy path — call sequence + payload + success result', async () => {
    const services = mockServices();
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });

    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.usulanId).toBe('usulan-1');
      expect(result.summary).toBe('1 row berubah di 1 section');
    }

    // Service calls verified
    expect(services.createUsulanDraft).toHaveBeenCalledTimes(1);
    expect(services.createUsulanDraft).toHaveBeenCalledWith(
      2026,
      'revisi_pok',
      expect.objectContaining({
        diusulkan_oleh: 'Sie Renbang (R5a proxy)',
        justifikasi: expect.stringContaining('TA 2026'),
        tanggal_pengajuan: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );

    expect(services.addPerubahan).toHaveBeenCalledTimes(1);
    expect(services.addPerubahan).toHaveBeenCalledWith(
      'usulan-1',
      'r1',
      expect.objectContaining({
        kode: '521115',
        nilai_semula: 1_000_000,
        nilai_revisi: 1_200_000,
        section_id: 'pagu-2026-a',
      })
    );

    expect(services.recordValidationAttempt).toHaveBeenCalledWith('usulan-1', 'pass');

    expect(services.transitionUsulan).toHaveBeenCalledWith(
      'usulan-1',
      'direkomendasi',
      { validatorsPassed: true, lhrApipAcknowledged: true }
    );
  });

  it('no_changes — tidak ada row berubah → return early, no service call', async () => {
    const services = mockServices();
    const result = await executeSubmitRevisiPOK({
      paguSections: [makeSection('pagu-2026-a', 'Section A', [makeRow({ hargaSatuanRevisi: 0 })])],
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });

    expect(result.kind).toBe('no_changes');
    expect(services.createUsulanDraft).not.toHaveBeenCalled();
    expect(services.addPerubahan).not.toHaveBeenCalled();
    expect(services.recordValidationAttempt).not.toHaveBeenCalled();
    expect(services.transitionUsulan).not.toHaveBeenCalled();
  });

  it('state_rejected — transitionUsulan returns allowed=false → surfaced', async () => {
    const services = mockServices({
      transitionUsulan: vi.fn().mockResolvedValue({
        result: { allowed: false, reason: 'LHR APIP belum di-acknowledge.' },
      }),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: false,
      services,
    });

    expect(result.kind).toBe('state_rejected');
    if (result.kind === 'state_rejected') {
      expect(result.reason).toBe('LHR APIP belum di-acknowledge.');
      expect(result.usulanId).toBe('usulan-1');
    }
    // Previous phases still ran (audit trail still recorded even kalau state rejected)
    expect(services.createUsulanDraft).toHaveBeenCalledTimes(1);
    expect(services.recordValidationAttempt).toHaveBeenCalledTimes(1);
  });

  it('state_rejected — uses default "unknown" reason kalau service skip reason field', async () => {
    const services = mockServices({
      transitionUsulan: vi.fn().mockResolvedValue({ result: { allowed: false } }),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('state_rejected');
    if (result.kind === 'state_rejected') {
      expect(result.reason).toBe('unknown');
    }
  });

  it('service_error in create phase — abort before addPerubahan', async () => {
    const services = mockServices({
      createUsulanDraft: vi.fn().mockRejectedValue(new Error('FK constraint violation')),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });

    expect(result.kind).toBe('service_error');
    if (result.kind === 'service_error') {
      expect(result.phase).toBe('create');
      expect(result.message).toBe('FK constraint violation');
    }
    expect(services.addPerubahan).not.toHaveBeenCalled();
    expect(services.transitionUsulan).not.toHaveBeenCalled();
  });

  it('service_error in perubahan phase — abort before validation', async () => {
    const services = mockServices({
      addPerubahan: vi.fn().mockRejectedValue(new Error('Network timeout')),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('service_error');
    if (result.kind === 'service_error') {
      expect(result.phase).toBe('perubahan');
    }
    expect(services.recordValidationAttempt).not.toHaveBeenCalled();
    expect(services.transitionUsulan).not.toHaveBeenCalled();
  });

  it('service_error in validation phase — abort before transition', async () => {
    const services = mockServices({
      recordValidationAttempt: vi.fn().mockRejectedValue(new Error('JSONB write conflict')),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('service_error');
    if (result.kind === 'service_error') {
      expect(result.phase).toBe('validation');
    }
    expect(services.transitionUsulan).not.toHaveBeenCalled();
  });

  it('service_error in transition phase — bubbled up', async () => {
    const services = mockServices({
      transitionUsulan: vi.fn().mockRejectedValue(new Error('RLS denied')),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('service_error');
    if (result.kind === 'service_error') {
      expect(result.phase).toBe('transition');
      expect(result.message).toBe('RLS denied');
    }
  });

  it('non-Error rejection (string) — di-stringify untuk message field', async () => {
    const services = mockServices({
      createUsulanDraft: vi.fn().mockRejectedValue('plain string error'),
    });
    const result = await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('service_error');
    if (result.kind === 'service_error') {
      expect(result.message).toBe('plain string error');
    }
  });

  it('multi-row submit — parallel addPerubahan calls + correct count', async () => {
    const services = mockServices();
    const sections: PaguSection[] = [
      makeSection('pagu-2026-a', 'Section A', [
        makeRow({
          id: 'r-a1',
          jumlahBiayaAwal: 1_000_000,
          hargaSatuanAwal: 1_000_000,
          hargaSatuanRevisi: 1_200_000,
          volume: 1,
          jumlahBiayaRevisi: 1_200_000,
        }),
        makeRow({
          id: 'r-a2',
          jumlahBiayaAwal: 500_000,
          hargaSatuanAwal: 500_000,
          hargaSatuanRevisi: 700_000,
          volume: 1,
          jumlahBiayaRevisi: 700_000,
        }),
      ]),
      makeSection('pagu-2026-b', 'Section B', [
        makeRow({
          id: 'r-b1',
          jumlahBiayaAwal: 2_000_000,
          hargaSatuanAwal: 2_000_000,
          hargaSatuanRevisi: 1_500_000,
          volume: 1,
          jumlahBiayaRevisi: 1_500_000,
        }),
      ]),
    ];
    const result = await executeSubmitRevisiPOK({
      paguSections: sections,
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      services,
    });
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.summary).toBe('3 row berubah di 2 section');
    }
    expect(services.addPerubahan).toHaveBeenCalledTimes(3);
  });

  it('respects custom diusulkanOleh', async () => {
    const services = mockServices();
    await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      diusulkanOleh: 'Karumkit (override)',
      services,
    });
    expect(services.createUsulanDraft).toHaveBeenCalledWith(
      2026,
      'revisi_pok',
      expect.objectContaining({ diusulkan_oleh: 'Karumkit (override)' })
    );
  });

  it('passes lhrApipAcknowledged=false ke transition context', async () => {
    const services = mockServices();
    await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: false,
      services,
    });
    expect(services.transitionUsulan).toHaveBeenCalledWith(
      'usulan-1',
      'direkomendasi',
      { validatorsPassed: true, lhrApipAcknowledged: false }
    );
  });

  // ─── Phase 2.5 — R3c tied audit propagation ────────────────────────────────

  it('[Phase 2.5] undefined lhrApipForYear → initialData.lhr_apip NOT populated (backward compat)', async () => {
    const services = mockServices();
    await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      // lhrApipForYear: undefined (Phase 2.4 default behavior)
      services,
    });

    // Verify createUsulanDraft initialData TIDAK contain lhr_apip key
    const draftCall = (services.createUsulanDraft as ReturnType<typeof vi.fn>).mock.calls[0];
    const initialData = draftCall[2];
    expect(initialData).not.toHaveProperty('lhr_apip');
  });

  it('[Phase 2.5] Strategy A lhrApipForYear (placeholder shape) → initialData.lhr_apip populated verbatim', async () => {
    const services = mockServices();
    const lhrApipForYear = {
      nomor: '(belum diisi)',
      tanggal: '2026-05-13',
      acknowledged_at: '2026-05-13T10:30:00.000Z',
    };
    await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      lhrApipForYear,
      services,
    });

    expect(services.createUsulanDraft).toHaveBeenCalledWith(
      2026,
      'revisi_pok',
      expect.objectContaining({
        lhr_apip: lhrApipForYear,
      })
    );
  });

  it('[Phase 2.5] Strategy B lhrApipForYear (real nomor + tanggal) → initialData.lhr_apip populated verbatim', async () => {
    const services = mockServices();
    const lhrApipForYear = {
      nomor: 'LHR-001/INSP/V/2026',
      tanggal: '2026-05-01',
      acknowledged_at: '2026-05-13T10:30:00.000Z',
    };
    await executeSubmitRevisiPOK({
      paguSections: defaultSectionsWithOneChange(),
      tahunAnggaran: 2026,
      lhrApipAcknowledged: true,
      lhrApipForYear,
      services,
    });

    expect(services.createUsulanDraft).toHaveBeenCalledWith(
      2026,
      'revisi_pok',
      expect.objectContaining({
        lhr_apip: lhrApipForYear,
      })
    );
  });
});

// ─── Phase 2.5 — shouldShowLhrApipBanner (banner V1 predicate) ───────────────

describe('shouldShowLhrApipBanner', () => {
  it('null state (Supabase belum load atau error) → returns true (show banner conservatively)', () => {
    expect(shouldShowLhrApipBanner(null, 2026)).toBe(true);
  });

  it('state ada tapi year entry tidak ada → returns true', () => {
    const state: LhrApipGlobalState = {};
    expect(shouldShowLhrApipBanner(state, 2026)).toBe(true);
  });

  it('year entry exists tapi acknowledged=false → returns true', () => {
    const state: LhrApipGlobalState = {
      2026: { acknowledged: false, acknowledged_at: '2026-05-13T10:00:00.000Z' },
    };
    expect(shouldShowLhrApipBanner(state, 2026)).toBe(true);
  });

  it('year entry exists dan acknowledged=true → returns false (banner hide)', () => {
    const state: LhrApipGlobalState = {
      2026: { acknowledged: true, acknowledged_at: '2026-05-13T10:00:00.000Z' },
    };
    expect(shouldShowLhrApipBanner(state, 2026)).toBe(false);
  });
});

// ─── Phase 2.5 — deriveLhrApipForSubmission (tied audit derivation) ──────────

describe('deriveLhrApipForSubmission', () => {
  it('null state → returns null (caller harus handle)', () => {
    expect(deriveLhrApipForSubmission(null, 2026)).toBeNull();
  });

  it('year entry tidak ada → returns null', () => {
    expect(deriveLhrApipForSubmission({}, 2026)).toBeNull();
  });

  it('year entry exists tapi acknowledged=false → returns null (Submit gate)', () => {
    const state: LhrApipGlobalState = {
      2026: { acknowledged: false, acknowledged_at: '2026-05-13T10:00:00.000Z' },
    };
    expect(deriveLhrApipForSubmission(state, 2026)).toBeNull();
  });

  it('Strategy A (no V2 fields) → placeholder nomor + tanggal-from-acknowledged_at', () => {
    const state: LhrApipGlobalState = {
      2026: {
        acknowledged: true,
        acknowledged_at: '2026-05-13T10:30:45.000Z',
      },
    };
    const result = deriveLhrApipForSubmission(state, 2026);
    expect(result).toEqual({
      nomor: '(belum diisi)',
      tanggal: '2026-05-13', // slice(0, 10) dari acknowledged_at
      acknowledged_at: '2026-05-13T10:30:45.000Z',
    });
  });

  it('Strategy B (V2 nomor + tanggal populated) → real values, bukan placeholder', () => {
    const state: LhrApipGlobalState = {
      2026: {
        acknowledged: true,
        acknowledged_at: '2026-05-13T10:30:45.000Z',
        nomor: 'LHR-001/INSP/V/2026',
        tanggal: '2026-05-01',
      },
    };
    const result = deriveLhrApipForSubmission(state, 2026);
    expect(result).toEqual({
      nomor: 'LHR-001/INSP/V/2026',
      tanggal: '2026-05-01',
      acknowledged_at: '2026-05-13T10:30:45.000Z',
    });
  });
});
