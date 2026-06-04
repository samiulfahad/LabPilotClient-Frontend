// React Compiler active — no useCallback/useMemo
import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import invoiceService from "../../api/invoice";
import { Btn, ErrorMsg, PageHeader, Sk, Badge, fmt, totalExpenses, totalPayments } from "./indoorPatientHelpers";

// ─── Portal Dropdown ──────────────────────────────────────────────────────────

const DropdownPortal = ({ anchorRef, open, children }) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setRect(r);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open || !rect) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "288px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 20px 40px -8px rgba(0,0,0,0.18)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

// ─── Step 1: Patient Search & Select ─────────────────────────────────────────

const PatientSearch = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchTimer = useRef(null);

  const doSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await indoorPatientService.getPatients({ status: "admitted", search: q, page: 1, limit: 20 });
      setResults(res.data.patients ?? []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 350);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-700">🔍 Search Admitted Patient</h3>
      </div>
      <div className="p-5">
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Type name, admission ID or phone..."
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {loading && (
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        {!searched && !loading && (
          <div className="text-center py-8 text-slate-400">
            <div className="text-3xl mb-2 opacity-40">🏥</div>
            <p className="text-sm">Search to find an admitted patient</p>
          </div>
        )}
        {searched && !results.length && (
          <div className="text-center py-8 text-slate-400">
            <div className="text-3xl mb-2 opacity-40">😶</div>
            <p className="text-sm font-medium text-slate-500">No admitted patients found</p>
          </div>
        )}
        {results.length > 0 && (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {results.map((p) => {
              const exp = totalExpenses(p.expenses);
              const paid = totalPayments(p.payments);
              const due = exp - paid;
              return (
                <button
                  key={p._id}
                  onClick={() => onSelect(p)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-blue-50/40 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-black shrink-0">
                      {p.patient?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{p.patient?.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.admissionId} · {p.patient?.age}y · {p.patient?.gender} · {p.space?.spaceName}
                        {p.space?.bedNumber != null ? ` · Bed ${p.space.bedNumber}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      {p.dealType === "package" ? (
                        <div className="text-xs font-semibold text-violet-600">Package Deal</div>
                      ) : (
                        <>
                          <div className="text-xs font-semibold text-slate-700">{fmt.currency(exp)}</div>
                          <div className={`text-xs ${due > 0 ? "text-red-500" : "text-emerald-600"}`}>
                            {due > 0 ? `Due: ${fmt.currency(due)}` : "Paid"}
                          </div>
                        </>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Step 2: Add Items Form ───────────────────────────────────────────────────

const AddItemsForm = ({ patient, onBack, onDone }) => {
  const [catalog, setCatalog] = useState({ tests: [], products: [] });
  const [catLoading, setCatLoading] = useState(true);
  const [itemQuery, setItemQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [selected, setSelected] = useState([]);
  const [paidInput, setPaidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const isPackage = patient.dealType === "package";

  useEffect(() => {
    invoiceService
      .getRequiredData()
      .then((res) => {
        setCatalog({ tests: res.data.tests ?? [], products: res.data.products ?? [] });
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));

    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = itemQuery.trim().toLowerCase();
  const filteredTests = q ? catalog.tests.filter((t) => t.name.toLowerCase().includes(q)) : catalog.tests;
  const filteredProducts = q ? catalog.products.filter((p) => p.name.toLowerCase().includes(q)) : catalog.products;

  const addTest = (test) => {
    const tid = test._id?.$oid ?? test.testId?.$oid ?? test.testId ?? test._id ?? null;
    if (selected.some((s) => s.itemId === tid && s.type === "test")) return;
    setSelected((prev) => [...prev, { type: "test", itemId: tid, name: test.name, price: test.price, quantity: 1 }]);
    setItemQuery("");
    setShowDrop(false);
  };

  const addProduct = (product) => {
    const pid = product._id?.$oid ?? product._id ?? null;
    const ptype = product.type ?? "other";
    if (selected.some((s) => s.itemId === pid && s.type === ptype)) return;
    setSelected((prev) => [
      ...prev,
      { type: ptype, itemId: pid, name: product.name, price: product.price, quantity: 1 },
    ]);
    setItemQuery("");
    setShowDrop(false);
  };

  const removeItem = (idx) => setSelected((prev) => prev.filter((_, i) => i !== idx));

  const setQty = (idx, qty) => {
    const v = Math.max(1, parseInt(qty) || 1);
    setSelected((prev) => prev.map((s, i) => (i === idx ? { ...s, quantity: v } : s)));
  };

  const total = selected.reduce((s, i) => s + i.price * i.quantity, 0);
  const paidAmount = isPackage ? 0 : Math.min(parseFloat(paidInput) || 0, total);
  const due = total - paidAmount;

  const handlePaidChange = (e) => {
    const v = e.target.value;
    if (v === "") {
      setPaidInput("");
      return;
    }
    const num = parseFloat(v);
    if (!isNaN(num) && num > total) {
      setPaidInput(String(total));
    } else {
      setPaidInput(v);
    }
  };

  const handleSubmit = async () => {
    if (!selected.length) return setError("Add at least one item");
    setError("");
    setSubmitting(true);
    try {
      await Promise.all(
        selected.map((item) =>
          indoorPatientService.addExpense(patient._id, {
            type: item.type,
            ...(item.itemId && String(item.itemId).length === 24 ? { itemId: item.itemId } : {}),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }),
        ),
      );
      if (!isPackage && paidAmount > 0) {
        await indoorPatientService.addPayment(patient._id, {
          amount: paidAmount,
          note: "Collected at item entry",
        });
      }
      setSuccess(true);
      setSelected([]);
      setPaidInput("");
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Items Added Successfully</h3>
        <p className="text-sm text-slate-400 mb-6">Expenses have been recorded for {patient.patient?.name}</p>
        <div className="flex gap-3 justify-center">
          <Btn
            variant="secondary"
            onClick={() => {
              setSuccess(false);
              onBack();
            }}
          >
            Add for Another Patient
          </Btn>
          <Btn variant="primary" onClick={onDone}>
            Done
          </Btn>
        </div>
      </div>
    );
  }

  const hasResults = filteredTests.length > 0 || filteredProducts.length > 0;

  return (
    <div className="space-y-4">
      {/* Patient strip */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-blue-900">{patient.patient?.name}</span>
            {isPackage && (
              <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                Package Deal
              </span>
            )}
          </div>
          <div className="text-xs text-blue-600 mt-0.5">
            {patient.admissionId} · {patient.space?.spaceName}
            {patient.space?.bedNumber != null ? ` · Bed ${patient.space.bedNumber}` : ""}
          </div>
        </div>
        <button onClick={onBack} className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline">
          Change Patient
        </button>
      </div>

      {/* Item search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-700">🧪 Search Tests & Products</h3>
        </div>
        <div className="p-5">
          {catLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Sk key={i} cls="h-10" />
              ))}
            </div>
          ) : (
            <div ref={wrapperRef}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search tests or products..."
                  value={itemQuery}
                  onChange={(e) => {
                    setItemQuery(e.target.value);
                    setShowDrop(true);
                  }}
                  onFocus={() => setShowDrop(true)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <DropdownPortal anchorRef={inputRef} open={showDrop && !!itemQuery}>
                {!hasResults ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">No results found</div>
                ) : (
                  <>
                    {filteredTests.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tests</span>
                        </div>
                        {filteredTests.map((t) => {
                          const already = selected.some((s) => s.itemId === t.testId && s.type === "test");
                          return (
                            <button
                              key={t.testId}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addTest(t);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-50 transition-colors ${already ? "bg-blue-50" : "hover:bg-slate-50"}`}
                            >
                              <div>
                                <div className="text-sm font-medium text-slate-800">{t.name}</div>
                                <div className="text-xs text-blue-600 font-semibold">{fmt.currency(t.price)}</div>
                              </div>
                              {already && <span className="text-xs text-blue-600 font-bold">✓ Added</span>}
                            </button>
                          );
                        })}
                      </>
                    )}
                    {filteredProducts.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products</span>
                        </div>
                        {filteredProducts.map((p) => {
                          const pid = p._id?.$oid ?? p._id ?? null;
                          const already = selected.some((s) => s.itemId === pid && s.type === (p.type ?? "other"));
                          const outOfStock = p.trackStock && (p.stock ?? 0) === 0;
                          return (
                            <button
                              key={p._id}
                              type="button"
                              disabled={outOfStock}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!outOfStock) addProduct(p);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-50 transition-colors ${outOfStock ? "opacity-40 cursor-not-allowed" : already ? "bg-blue-50" : "hover:bg-slate-50"}`}
                            >
                              <div>
                                <div className="text-sm font-medium text-slate-800">{p.name}</div>
                                <div className="text-xs text-blue-600 font-semibold">{fmt.currency(p.price)}</div>
                                {p.trackStock && (
                                  <div
                                    className={`text-xs mt-0.5 ${outOfStock ? "text-red-500 font-medium" : "text-slate-400"}`}
                                  >
                                    Stock: {p.stock ?? 0}
                                  </div>
                                )}
                              </div>
                              {already && <span className="text-xs text-blue-600 font-bold">✓ Added</span>}
                              {outOfStock && <span className="text-xs text-red-500 font-bold">Out of Stock</span>}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </DropdownPortal>
            </div>
          )}
        </div>
      </div>

      {/* Selected items */}
      {selected.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">🧾 Selected Items ({selected.length})</h3>
            <span className="text-sm font-bold text-slate-800">{fmt.currency(total)}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {selected.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={item.type === "test" ? "blue" : item.type === "medicine" ? "green" : "slate"}>
                      {item.type === "other" ? "product" : item.type}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {fmt.currency(item.price)}
                      {item.type !== "test" && ` × ${item.quantity} = ${fmt.currency(item.price * item.quantity)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.type !== "test" && (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => setQty(idx, e.target.value)}
                      className="w-16 text-center py-1.5 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                  )}
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + payment */}
          <div className="mx-5 my-4 rounded-xl border border-slate-200 overflow-hidden">
            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-sm text-slate-500 font-medium">Items Total</span>
              <span className="text-sm font-bold text-slate-800">{fmt.currency(total)}</span>
            </div>

            {/* Collect payment — hidden for package deals */}
            {isPackage ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <svg
                  className="w-4 h-4 text-violet-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs text-violet-600 font-medium">
                  Package deal — payment is managed from the patient's billing section
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 gap-4">
                  <span className="text-sm text-slate-500 font-medium shrink-0">Collect Payment</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-medium">৳</span>
                    <input
                      type="number"
                      min="0"
                      max={total}
                      step="0.01"
                      placeholder="0"
                      value={paidInput}
                      onChange={handlePaidChange}
                      className="w-32 text-right py-1.5 px-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-slate-600">Due</span>
                  <span className={`text-sm font-bold ${due > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {due > 0 ? fmt.currency(due) : "Fully Paid ✓"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="px-5 pb-4 space-y-3">
            <ErrorMsg msg={error} />
            <div className="flex gap-3">
              <Btn variant="secondary" size="lg" className="flex-1" onClick={onBack}>
                Cancel
              </Btn>
              <Btn variant="primary" size="lg" className="flex-1" loading={submitting} onClick={handleSubmit}>
                {isPackage
                  ? `Add ${selected.length} Item${selected.length !== 1 ? "s" : ""} · ${fmt.currency(total)}`
                  : paidAmount > 0
                    ? `Add Items & Collect ${fmt.currency(paidAmount)}`
                    : `Add ${selected.length} Item${selected.length !== 1 ? "s" : ""} · ${fmt.currency(total)}`}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <div className="text-center py-4 text-xs text-slate-400">Search and select items to add above</div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AddItemsToPatient = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [preloading, setPreloading] = useState(false);

  // If arriving from PatientDetail with ?patientId=xxx, auto-load that patient
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    setPreloading(true);
    indoorPatientService
      .getPatient(patientId)
      .then((res) => setSelectedPatient(res.data))
      .catch(() => {})
      .finally(() => setPreloading(false));
  }, []);

  // When coming from a specific patient, "Done" and "Change Patient" go back to that patient's detail
  const originPatientId = searchParams.get("patientId");
  const handleDone = () => (originPatientId ? navigate(`/ipd/patient/${originPatientId}`) : navigate("/ipd"));
  const handleBack = () => {
    if (originPatientId) return navigate(`/ipd/patient/${originPatientId}`);
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <PageHeader
          title="Add Tests / Products"
          subtitle={
            selectedPatient ? `Adding items for ${selectedPatient.patient?.name}` : "Select an admitted patient first"
          }
          back={handleDone}
        />

        {preloading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Sk key={i} cls="h-16 rounded-2xl" />
            ))}
          </div>
        ) : !selectedPatient ? (
          <PatientSearch onSelect={setSelectedPatient} />
        ) : (
          <AddItemsForm patient={selectedPatient} onBack={handleBack} onDone={handleDone} />
        )}
      </div>
    </div>
  );
};

export default AddItemsToPatient;
