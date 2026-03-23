/**
 * QBank configuration system.
 *
 * Each qbank is a config object in src/configs/.
 * The active qbank is determined by the VITE_QBANK_ID env var.
 *
 * To add a new qbank:
 *   1. Create src/configs/myqbank.js  (copy an existing one)
 *   2. Deploy with VITE_QBANK_ID=myqbank
 */

// Import all qbank configs
import hc_compliance from './hc_compliance';
import clinical_research from './clinical_research';

const configs = {
  hc_compliance,
  clinical_research,
};

const activeId = import.meta.env.VITE_QBANK_ID || 'hc_compliance';

if (!configs[activeId]) {
  console.error(
    `Unknown VITE_QBANK_ID="${activeId}". Available: ${Object.keys(configs).join(', ')}`
  );
}

/** The active qbank configuration */
export const qbank = configs[activeId] || configs.hc_compliance;

/** All registered qbank IDs (useful for admin tooling) */
export const allQbankIds = Object.keys(configs);
