'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { SupportedLanguage } from '@/i18n/types';

export function LanguageSelector() {
  const { language, setLanguage, meta, t, isIndic } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const indianLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'indian');
  const globalLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'global');

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Change language / भाषा बदलें"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid #334155',
          borderRadius: '8px',
          color: '#f8fafc',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#10b981';
          e.currentTarget.style.backgroundColor = 'rgba(6, 78, 59, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#334155';
          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.85)';
        }}
      >
        <Globe size={16} color="#34d399" />
        <span className={isIndic ? 'indic-text' : ''} style={{ fontSize: '13px', fontWeight: 700 }}>
          {meta.nativeLabel}
        </span>
      </button>

      {/* Language Selection Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.languages.selectLanguage}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            ref={modalRef}
            style={{
              backgroundColor: '#121826',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                backgroundColor: '#121826',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <Globe size={18} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {t.languages.selectLanguage}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Indian Regional Languages */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🇮🇳</span> {t.languages.indianLanguages}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {indianLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                          border: isSelected ? '1.5px solid #10b981' : '1px solid #334155',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div
                            className="indic-text"
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: isSelected ? '#34d399' : '#f8fafc',
                              lineHeight: 1.3,
                            }}
                          >
                            {lang.nativeLabel}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {lang.label}
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="#34d399" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Global Languages */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#a78bfa',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🌍</span> {t.languages.globalLanguages}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {globalLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                          border: isSelected ? '1.5px solid #10b981' : '1px solid #334155',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div
                            className={lang.script === 'indic' ? 'indic-text' : ''}
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: isSelected ? '#34d399' : '#f8fafc',
                              lineHeight: 1.3,
                            }}
                          >
                            {lang.nativeLabel}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {lang.label}
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="#34d399" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}