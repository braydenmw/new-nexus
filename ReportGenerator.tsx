


import React, { useState, useEffect } from 'react';
import type { ReportParameters, UserType, MarketAnalysisTier, PartnerFindingTier, ReportTier } from '../types';
import { INDUSTRIES, COUNTRIES, COMPANY_SIZES, KEY_TECHNOLOGIES, TARGET_MARKETS, GOVERNMENT_DEPARTMENTS, NON_GOV_ORG_TYPES, MARKET_ANALYSIS_TIER_DETAILS, PARTNER_FINDING_TIER_DETAILS } from '../constants';
import { Card } from './common/Card';
import { fetchRegionalCities } from '../services/nexusService';
import { PartnerIcon, BookOpenIcon, RocketLaunchIcon } from './Icons';

interface ReportGeneratorProps {
  onGenerate: (params: ReportParameters) => void;
  isGenerating: boolean;
}

const ProgressIndicator: React.FC<{ current: number; labels: string[] }> = ({ current, labels }) => (
    <div className="w-full mb-10 px-4">
        <ol className="flex items-center w-full">
            {labels.map((label, index) => {
                const step = index + 1;
                const isCompleted = current > step;
                const isCurrent = current === step;
                return (
                    <li key={label} className={`flex items-center text-sm md:text-base ${index < labels.length - 1 ? 'w-full' : ''}`}>
                        <div className="flex flex-col md:flex-row items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all duration-300
                                ${isCompleted ? 'bg-purple-600' : isCurrent ? 'bg-cyan-500 scale-110 shadow-lg shadow-cyan-500/30' : 'bg-slate-700'}`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                    </svg>
                                ) : (
                                    <span className={`font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{step}</span>
                                )}
                            </div>
                            <div className="mt-2 md:mt-0 md:ml-4 text-center md:text-left">
                                <h3 className={`font-medium ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{label}</h3>
                            </div>
                        </div>
                        {index < labels.length - 1 && (
                            <div className={`flex-auto border-t-2 transition-all duration-500 mx-4 ${isCompleted ? 'border-purple-600' : 'border-slate-700'}`}></div>
                        )}
                    </li>
                );
            })}
        </ol>
    </div>
);

const placeholderMatchmaking = "Example:\n'My department is leading a new initiative to develop a local AgriTech hub. My objective is to attract a foreign technology partner to establish a new R&D and production facility in our region. This partner should leverage our strong agricultural base and skilled workforce to produce precision agriculture solutions (like drones or soil sensors) for both domestic and export markets. The goal is to create high-skilled jobs, transfer technology, and boost our agricultural sector's productivity.'";
const placeholderAnalysis = "Example:\n'My objective is to understand the current state and future potential of the Advanced Manufacturing sector in our region. I need a comprehensive analysis of our strengths (supported by Location Quotient data), weaknesses, opportunities (including supply chain gaps), and threats (informed by Shift-Share analysis of our competitiveness). This will inform our new 5-year economic development strategy.'";

const StepHeader: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-cyan-400">{title}</h3>
        <p className="text-gray-400 mt-1 max-w-2xl mx-auto">{children}</p>
    </div>
);

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Profile
  const [userType, setUserType] = useState<UserType>('government');
  const [userName, setUserName] = useState('');
  const [userDepartment, setUserDepartment] = useState(GOVERNMENT_DEPARTMENTS[0]);
  const [userCountry, setUserCountry] = useState('Australia');
  const [isManualDept, setIsManualDept] = useState(false);
  
  // Step 2: Goal
  const [analysisMode, setAnalysisMode] = useState<'analysis' | 'matchmaking' | null>(null);

  // Step 3: Scope
  const [targetCountry, setTargetCountry] = useState('Philippines');
  const [regionalCity, setRegionalCity] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[4]);
  const [manualCityEntry, setManualCityEntry] = useState(false);
  const [manualIndustry, setManualIndustry] = useState('');
  const [isManualIndustry, setIsManualIndustry] = useState(false);

  // Step 4: Tier
  const [tier, setTier] = useState<ReportTier | null>(null);

  // Step 5: Finalize
  const [customObjective, setCustomObjective] = useState('');
  const [companySize, setCompanySize] = useState(COMPANY_SIZES[0]);
  const [keyTechnologies, setKeyTechnologies] = useState<string[]>([]);
  const [targetMarket, setTargetMarket] = useState<string[]>([]);
  const [manualKeyTech, setManualKeyTech] = useState('');
  const [isManualKeyTech, setIsManualKeyTech] = useState(false);

  // City loader state
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [cityLookupError, setCityLookupError] = useState<string | null>(null);
  const [regionalCities, setRegionalCities] = useState<string[]>([]);

  useEffect(() => {
    let isCancelled = false;
    if (manualCityEntry || !targetCountry) {
        setRegionalCities([]);
        setRegionalCity('');
        return;
    }
    
    const timerId = setTimeout(() => {
        const loadCities = async () => {
          setIsCityLoading(true); setCityLookupError(null); setRegionalCity(''); setRegionalCities([]);
          try {
            const cities = await fetchRegionalCities(targetCountry);
            if (isCancelled) return;
            if (cities && cities.length > 0) { setRegionalCities(cities); setRegionalCity(cities[0]); } 
            else { setCityLookupError(`No regional centers found. Please enter manually.`); setManualCityEntry(true); }
          } catch (error) {
            if (isCancelled) return;
            setCityLookupError((error as Error).message || "An unknown error occurred."); setManualCityEntry(true);
          } finally {
            if (!isCancelled) setIsCityLoading(false);
          }
        };
        loadCities();
    }, 100);
    return () => { isCancelled = true; clearTimeout(timerId); };
  }, [targetCountry, manualCityEntry]);

  const handleModeSelect = (mode: 'analysis' | 'matchmaking') => {
    setAnalysisMode(mode);
    setTier(null); // Reset tier when mode changes
    setCurrentStep(3);
  };

  const handleTierSelect = (selectedTier: ReportTier) => {
    setTier(selectedTier);
    setCurrentStep(5);
  };

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisMode || !tier) { alert("An error occurred. Please restart the process."); setCurrentStep(1); return; }

    const finalIndustry = isManualIndustry ? manualIndustry : industry;
    const region = `${manualCityEntry ? regionalCity : regionalCity}, ${targetCountry}`;
    
    let params: ReportParameters;

    if (analysisMode === 'analysis') {
        params = {
            analysisMode,
            tier: tier as MarketAnalysisTier,
            userName, userType, userDepartment: isManualDept ? userDepartment : userDepartment, userCountry,
            region, industry: finalIndustry, customObjective
        };
    } else {
        const finalKeyTechs = isManualKeyTech ? manualKeyTech.split(',').map(t => t.trim()).filter(Boolean) : keyTechnologies;
        params = {
            analysisMode,
            tier: tier as PartnerFindingTier,
            userName, userType, userDepartment: isManualDept ? userDepartment : userDepartment, userCountry,
            region, industry: finalIndustry, customObjective,
            companySize,
            keyTechnologies: finalKeyTechs,
            targetMarket
        };
    }
    onGenerate(params);
  };

  const inputStyles = "w-full p-3 bg-slate-800/80 border border-nexus-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition placeholder:text-gray-500 disabled:bg-slate-900 disabled:cursor-not-allowed";
  const labelStyles = "block text-sm font-medium text-gray-400 mb-2";
  const ManualEntryCheckbox: React.FC<{ isChecked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ isChecked, onChange }) => (
    <label className="flex items-center text-xs text-gray-400 cursor-pointer">
      <input type="checkbox" checked={isChecked} onChange={onChange} className="mr-2 h-4 w-4 rounded bg-slate-700 border-slate-500 text-purple-500 focus:ring-purple-600"/> Manual/Other
    </label>
  );

  const wizardLabels = analysisMode === 'matchmaking' 
    ? ["Profile", "Goal", "Scope", "Tier", "Finalize"] 
    : ["Profile", "Goal", "Scope", "Tier", "Finalize"];
  const totalSteps = 5;

  const renderStepContent = () => {
      switch (currentStep) {
          case 1: return ( // Your Profile
            <Card className="bg-nexus-surface p-6 md:p-8">
                <StepHeader title="Step 1: Your Profile">Tell us who is commissioning this report.</StepHeader>
                <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label className={labelStyles}>Are you representing a...</label>
                        <div className="flex gap-4">
                            {(['government', 'non-government'] as UserType[]).map(type => (
                                <button key={type} type="button" onClick={() => { setUserType(type); setUserDepartment(type === 'government' ? GOVERNMENT_DEPARTMENTS[0] : NON_GOV_ORG_TYPES[0]); setIsManualDept(false); }} className={`flex-1 p-3 text-center rounded-lg border-2 transition ${userType === type ? 'bg-purple-900/50 border-purple-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                                    {type === 'government' ? 'Government Body' : 'Non-Government Org'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                          <label htmlFor="userDepartment" className={labelStyles}>{userType === 'government' ? 'Department' : 'Organization Type'}</label>
                          <ManualEntryCheckbox isChecked={isManualDept} onChange={e => setIsManualDept(e.target.checked)} />
                        </div>
                        {isManualDept ? (
                           <input type="text" id="userDepartment" value={userDepartment} onChange={e => setUserDepartment(e.target.value)} className={inputStyles} placeholder="Enter your organization..." />
                        ) : (
                          <select id="userDepartment" value={userDepartment} onChange={e => setUserDepartment(e.target.value)} className={inputStyles}>
                              {(userType === 'government' ? GOVERNMENT_DEPARTMENTS : NON_GOV_ORG_TYPES).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                    </div>
                    <div><label htmlFor="userName" className={labelStyles}>Your Name</label><input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} className={inputStyles} placeholder="e.g., Jane Doe" required /></div>
                    <div><label htmlFor="userCountry" className={labelStyles}>Your Country</label><select id="userCountry" value={userCountry} onChange={(e) => setUserCountry(e.target.value)} className={inputStyles} required>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
            </Card>
          );
          case 2: return ( // Define Goal
              <Card className="bg-nexus-surface p-6 md:p-8">
                  <StepHeader title="Step 2: Define Your Goal">What is the primary objective of this report?</StepHeader>
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      <div onClick={() => handleModeSelect('analysis')} className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-slate-800/50 hover:border-cyan-400 hover:bg-cyan-900/20`}>
                          <BookOpenIcon className="w-12 h-12 text-cyan-400 mb-4" />
                          <h4 className="text-xl font-bold text-cyan-300 mb-3">Analyze a Market / Region</h4>
                          <p className="text-gray-400 text-sm">Conduct a deep-dive analysis of a specific industry within a region to understand its potential, challenges, and competitive landscape using regional science methodologies.</p>
                      </div>
                      <div onClick={() => handleModeSelect('matchmaking')} className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-slate-800/50 hover:border-purple-400 hover:bg-purple-900/20`}>
                          <PartnerIcon className="w-12 h-12 text-purple-400 mb-4" />
                          <h4 className="text-xl font-bold text-purple-300 mb-3">Find a Strategic Partner</h4>
                          <p className="text-gray-400 text-sm">Identify and vet specific private sector companies (e.g., investors, tech providers) that align with your region's strategic development goals.</p>
                      </div>
                  </div>
              </Card>
          );
          case 3: return ( // Set Scope
            <Card className="bg-nexus-surface p-6 md:p-8">
                <StepHeader title="Step 3: Set the Report Scope">Define the geographic and industrial focus for the analysis.</StepHeader>
                <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div><label htmlFor="targetCountry" className={labelStyles}>Target Country</label><select id="targetCountry" value={targetCountry} onChange={(e) => { setTargetCountry(e.target.value); setManualCityEntry(false); }} className={inputStyles} required>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><div className="flex justify-between items-center mb-2"><label htmlFor="regionalCity" className={labelStyles}>Regional City / Area</label><ManualEntryCheckbox isChecked={manualCityEntry} onChange={(e) => setManualCityEntry(e.target.checked)} /></div>
                        {manualCityEntry ? <input type="text" id="regionalCity" value={regionalCity} onChange={(e) => setRegionalCity(e.target.value)} className={inputStyles} placeholder="e.g., Clark Freeport Zone" required/> : isCityLoading ? <div className={`${inputStyles} flex items-center justify-center text-gray-400`}><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Fetching...</div> : regionalCities.length > 0 ? <select id="regionalCity" value={regionalCity} onChange={(e) => setRegionalCity(e.target.value)} className={inputStyles} required>{regionalCities.map(c => <option key={c} value={c}>{c}</option>)}</select> : <input type="text" className={inputStyles} placeholder="Select target country" disabled/>}
                        {cityLookupError && <p className="text-red-400 text-xs mt-2">{cityLookupError}</p>}
                    </div>
                    <div className="md:col-span-2"><div className="flex justify-between items-center mb-2"><label htmlFor="industry" className={labelStyles}>Industry Focus</label><ManualEntryCheckbox isChecked={isManualIndustry} onChange={(e) => setIsManualIndustry(e.target.checked)} /></div>
                        {isManualIndustry ? <input type="text" id="industry" value={manualIndustry} onChange={e => setManualIndustry(e.target.value)} className={inputStyles} placeholder="Enter custom industry" required/> : <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputStyles} required>{INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}</select>}
                    </div>
                </div>
            </Card>
          );
          case 4: // Select Tier
            const tiersToShow = analysisMode === 'analysis' ? MARKET_ANALYSIS_TIER_DETAILS : PARTNER_FINDING_TIER_DETAILS;
            return (
              <div>
                   <StepHeader title="Step 4: Select Your Report Tier">Each tier provides a progressively deeper level of analysis for your chosen goal.</StepHeader>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {tiersToShow.map(detail => (
                       <Card key={detail.tier} className="flex flex-col p-5 bg-slate-800/50 border border-nexus-border hover:border-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/10">
                           <div className="flex-grow">
                               <h4 className="font-bold text-cyan-400 text-lg">{detail.tier}</h4>
                               <p className="text-sm text-gray-400 mt-2 pb-4">{detail.brief}</p>
                               <div className="border-t border-nexus-border my-4"></div>
                               <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Key Deliverables</p>
                               <ul className="space-y-1.5 text-sm text-gray-300 mb-4">
                                  {detail.keyDeliverables.map((item, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                          {typeof item === 'string' ? ( <> <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> <span>{item}</span> </> ) : ( <span className="text-xs italic text-gray-500 pl-6">{item.subItem}</span> )}
                                      </li>
                                  ))}
                               </ul>
                           </div>
                            <div className="border-t border-nexus-border pt-4 mt-auto">
                                <div className="flex justify-between items-baseline text-sm mb-4">
                                   <span className="font-semibold text-green-400 text-base">{detail.cost}</span>
                                   <span className="text-gray-400 font-medium">{detail.pageCount}</span>
                               </div>
                               <button onClick={() => handleTierSelect(detail.tier)} className="w-full bg-nexus-blue text-white font-bold py-2.5 px-4 rounded-lg hover:bg-sky-400 transition-colors">
                                   Select & Configure
                               </button>
                           </div>
                       </Card>
                     ))}
                   </div>
              </div>
            );
          case 5: return ( // Finalize
              <Card className="bg-nexus-surface p-6 md:p-8">
                  <StepHeader title="Step 5: Refine & Finalize">Provide the final details to guide the AI analysis.</StepHeader>
                  <div className="max-w-3xl mx-auto space-y-8">
                    {analysisMode === 'matchmaking' && (
                        <div>
                          <h4 className="font-semibold text-purple-300 text-lg mb-4 text-center">Ideal Partner Profile</h4>
                          <div className="grid lg:grid-cols-2 gap-8">
                              <div><label htmlFor="companySize" className={labelStyles}>Partner Company Size</label><select id="companySize" value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputStyles} required>{COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                              <div><label htmlFor="targetMarket" className={labelStyles}>Partner's Target Markets <span className="text-red-400">*</span></label><select id="targetMarket" multiple value={targetMarket} onChange={(e) => setTargetMarket(Array.from(e.target.selectedOptions, option => option.value))} className={`${inputStyles} h-32`} required>{TARGET_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                              <div className="lg:col-span-2"><div className="flex justify-between items-center mb-2"><label htmlFor="keyTechnologies" className={labelStyles}>Key Technologies / Capabilities <span className="text-red-400">*</span></label><ManualEntryCheckbox isChecked={isManualKeyTech} onChange={e => setIsManualKeyTech(e.target.checked)} /></div>
                                  {isManualKeyTech ? <textarea id="keyTechnologies" value={manualKeyTech} onChange={e => setManualKeyTech(e.target.value)} className={`${inputStyles} h-32`} placeholder="Enter technologies, separated by commas" required/> : <select id="keyTechnologies" multiple value={keyTechnologies} onChange={(e) => setKeyTechnologies(Array.from(e.target.selectedOptions, option => option.value))} className={`${inputStyles} h-32`} required>{KEY_TECHNOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}</select>}
                              </div>
                          </div>
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-purple-300 text-lg mb-4 text-center">Your Strategic Intent</h4>
                        <p className="text-gray-400 mb-4 text-sm text-center">This is the most critical step. Your detailed objective will become the primary directive for the Nexus AI's analysis.</p>
                        <textarea value={customObjective} onChange={(e) => setCustomObjective(e.target.value)} rows={8} className={inputStyles} placeholder={analysisMode === 'matchmaking' ? placeholderMatchmaking : placeholderAnalysis} required/>
                    </div>
                  </div>
              </Card>
          );
          default: return <div>Invalid Step</div>;
      }
  };
  
  return (
    <div className="overflow-y-auto h-full p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter">Nexus Report Generator</h2>
        <p className="text-gray-400 mt-2">A guided process for generating bespoke strategic intelligence.</p>
      </header>
      
      <div className="w-full max-w-7xl">
        {currentStep > 0 && <ProgressIndicator current={currentStep} labels={wizardLabels} />}
        <form onSubmit={handleSubmit}>
            {renderStepContent()}
            <div className="mt-8 flex justify-between items-center">
                <button type="button" onClick={handleBack} disabled={currentStep === 1} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Back
                </button>
                {currentStep < totalSteps ? (
                    <button type="button" onClick={handleNext} disabled={currentStep === 2 && !analysisMode} className="bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                ) : (
                    <button type="submit" disabled={isGenerating || !customObjective} className="bg-gradient-to-r from-green-500 to-teal-400 text-white font-bold py-3 px-10 rounded-lg hover:opacity-90 transition-all disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px] text-lg shadow-lg shadow-green-500/20 disabled:shadow-none">
                        {isGenerating ? (
                            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>
                        ) : (
                            <div className="flex items-center gap-2">
                                <RocketLaunchIcon className="w-6 h-6" />
                                <span>Activate Nexus AI</span>
                            </div>
                        )}
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};