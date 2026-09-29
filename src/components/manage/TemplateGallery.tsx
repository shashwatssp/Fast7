import React, { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { useAuth } from "../../auth/AuthContext";
import RestaurantPage from "../website/RestaurantPage";
import { TEMPLATES, SAMPLE_RESTAURANT, type TemplateDef } from "../website/templates";
import { X, Eye, Check, LogIn, ArrowLeft, Palette } from "lucide-react";
import "./TemplateGallery.css";

interface TemplateGalleryProps {
  /** When true, shows a back-to-dashboard link (used inside /manage/templates) */
  showBackLink?: boolean;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ showBackLink }) => {
  const { currentUser, restaurantData, refreshRestaurantData } = useAuth();
  const navigate = useNavigate();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>("ember");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDef | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Apply templates to the restaurant currently selected on the dashboard.
  useEffect(() => {
    setRestaurantId(restaurantData?.id || null);
    setCurrentTemplate((restaurantData as typeof restaurantData & { templateId?: string })?.templateId || "ember");
  }, [restaurantData]);

  const handleApply = async (tpl: TemplateDef) => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    if (!restaurantId) {
      alert("No restaurant found for your account yet. Finish onboarding first.");
      return;
    }
    try {
      setApplyingId(tpl.id);
      await updateDoc(doc(db, "restaurants", restaurantId), { templateId: tpl.id });
      setCurrentTemplate(tpl.id);
      await refreshRestaurantData();
      setApplySuccess(tpl.id);
      setTimeout(() => setApplySuccess(null), 2500);
    } catch (err) {
      console.error("Error applying template:", err);
      alert("Could not apply the template. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="tg-page">
      <header className="tg-header">
        <div className="tg-header-inner">
          <div>
            {showBackLink && (
              <button className="tg-back" onClick={() => navigate("/manage")}>
                <ArrowLeft size={15} /> Back to Dashboard
              </button>
            )}
            <h1 className="tg-title">
              <Palette size={26} /> Choose Your Website Look
            </h1>
            <p className="tg-sub">
              Every template is fully responsive and comes with live preview.
              {currentUser
                ? " Apply one and your website updates instantly."
                : " Sign in to apply one to your restaurant."}
            </p>
          </div>
          {restaurantId ? (
            <span className="tg-current-chip">
              <Check size={14} /> Current: {getTemplateName(currentTemplate)}
            </span>
          ) : null}
        </div>
      </header>

      <main className="tg-main">
        <div className="tg-grid">
          {TEMPLATES.map((tpl) => {
            const isCurrent = Boolean(currentUser && restaurantId && currentTemplate === tpl.id);
            return (
              <article key={tpl.id} className={`tg-card ${isCurrent ? "is-current" : ""}`}>
                <div className={`tg-mini tpl-${tpl.id}`}>
                  <div className="tg-mini-hero">
                    <span className="tg-mini-pill" />
                    <span className="tg-mini-title" />
                    <span className="tg-mini-cta" />
                  </div>
                  <div className="tg-mini-cards">
                    <span />
                    <span />
                  </div>
                </div>
                <div className="tg-card-body">
                  <div className="tg-card-head">
                    <h2>{tpl.name}</h2>
                    {isCurrent && <span className="tg-current-badge">In use</span>}
                  </div>
                  <p className="tg-tagline">{tpl.tagline}</p>
                  <div className="tg-card-actions">
                    <button className="tg-preview-btn" onClick={() => setPreviewTemplate(tpl)}>
                      <Eye size={15} /> Preview
                    </button>
                    {currentUser ? (
                      <button
                        className="tg-apply-btn"
                        disabled={applyingId === tpl.id || isCurrent}
                        onClick={() => handleApply(tpl)}
                      >
                        {applySuccess === tpl.id ? (
                          <>
                            <Check size={15} /> Applied!
                          </>
                        ) : isCurrent ? (
                          <>
                            <Check size={15} /> Current Template
                          </>
                        ) : applyingId === tpl.id ? (
                          "Applying…"
                        ) : (
                          "Use this Template"
                        )}
                      </button>
                    ) : (
                      <button className="tg-apply-btn" onClick={() => navigate("/")}>
                        <LogIn size={15} /> Sign in to Apply
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Full live preview */}
      {previewTemplate && (
        <div className="tg-preview-modal">
          <div className="tg-preview-bar">
            <div className="tg-preview-meta">
              <strong>{previewTemplate.name}</strong>
              <span>{previewTemplate.tagline}</span>
            </div>
            <div className="tg-preview-actions">
              {currentUser ? (
                <button
                  className="tg-apply-btn"
                  disabled={applyingId === previewTemplate.id}
                  onClick={() => handleApply(previewTemplate)}
                >
                  {applySuccess === previewTemplate.id ? (
                    <>
                      <Check size={15} /> Applied!
                    </>
                  ) : applyingId === previewTemplate.id ? (
                    "Applying…"
                  ) : (
                    "Use this Template"
                  )}
                </button>
              ) : (
                <button className="tg-apply-btn" onClick={() => navigate("/")}>
                  <LogIn size={15} /> Sign in to Apply
                </button>
              )}
              <button className="tg-close-btn" onClick={() => setPreviewTemplate(null)} aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="tg-preview-body">
            <RestaurantPage previewData={SAMPLE_RESTAURANT} templateOverride={previewTemplate.id} />
          </div>
        </div>
      )}
    </div>
  );
};

function getTemplateName(id: string): string {
  return TEMPLATES.find((t) => t.id === id)?.name || "Ember";
}

export default TemplateGallery;
