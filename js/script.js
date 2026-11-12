document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'en';
    let currentFilter = 'all';
    let currentTab = 'projects-view';
    let loadedData = {};

    const htmlEl = document.documentElement;
    const titleEl = document.querySelector('title');
    const metaDescriptionEl = document.querySelector('meta[name="description"]');
    const headerNameEl = document.getElementById('header-name');
    const langSwitchBtn = document.getElementById('lang-switch');
    const introParagraphEl = document.getElementById('intro-paragraph');
    const profilePicEl = document.getElementById('profile-pic');
    const teaserSectionEl = document.getElementById('teaser');
    const teaserAnimEl = document.getElementById('teaser-anim');
    const categoriesTitleEl = document.getElementById('categories-title');
    const categoryFilterContainer = document.getElementById('category-filter');
    const projectsListContainer = document.getElementById('projects-list');
    const patentsTitleEl = document.getElementById('patents-title');
    const patentsListContainer = document.getElementById('patents-list');
    const contactDetailsContainer = document.getElementById('contact-details');
    const footerCopyrightEl = document.getElementById('footer-copyright');
    const tabBtnProjects = document.getElementById('tab-btn-projects');
    const tabBtnPublications = document.getElementById('tab-btn-publications');
    const tabBtnServices = document.getElementById('tab-btn-services');
    const tabBtnContact = document.getElementById('tab-btn-contact');
    const projectsViewPane = document.getElementById('projects-view');
    const publicationsViewPane = document.getElementById('publications-view');
    const servicesViewPane = document.getElementById('services-view');
    const contactViewPane = document.getElementById('contact-view');
    const publicationsListAllContainer = document.getElementById('publications-list-all');
    const servicesTitleEl = document.getElementById('services-title');
    const servicesContentEl = document.getElementById('services-content');
    const tabContentContainer = document.getElementById('tab-content');
    const screenReaderStatusEl = document.getElementById('screen-reader-status');

    const validLangs = ['en', 'ja'];
    const validTabNames = ['projects', 'publications', 'services', 'contact'];
    const validTabViewIds = ['projects-view', 'publications-view', 'services-view', 'contact-view'];
    const defaultLang = 'en';
    const defaultTabName = 'projects';
    const tabButtons = [tabBtnProjects, tabBtnPublications, tabBtnServices, tabBtnContact];
    const tabPanes = [projectsViewPane, publicationsViewPane, servicesViewPane, contactViewPane];

    function escapeAttribute(value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function getLanguageName(lang) {
        return lang === 'ja' ? 'Japanese' : 'English';
    }

    function getPublicationActionLabel(action, item) {
        return `${action} for ${item.title || 'Untitled'}`;
    }

    function getMailtoAddress(email) {
        return String(email || '').replace(/\s*\[at\]\s*/i, '@').replace(/\s*\[dot\]\s*/gi, '.').replace(/\s+/g, '');
    }

    function announceStatus(message) {
        if (screenReaderStatusEl) screenReaderStatusEl.textContent = message;
    }

    async function loadAllData(lang) {
        const langToLoad = validLangs.includes(lang) ? lang : defaultLang;
        let actualLoadedUiLang = langToLoad;
        console.log(`Attempting to load data for language: ${langToLoad}`);
        const uiFile = `data/ui_${langToLoad}.json`;
        const projectsFile = `data/projects_${langToLoad}.json`;
        const patentsFile = `data/patents_${langToLoad}.json`;
        const publicationsFile = `data/publications.json`;

        const fetchJson = async (baseUrl, isLangSpecific) => {
            let attemptUrl = isLangSpecific ? baseUrl.replace('{lang}', langToLoad) : baseUrl;
            let loadedLang = langToLoad;
            try {
                let response = await fetch(`${attemptUrl}?v=${Date.now()}`);
                if (!response.ok && isLangSpecific && langToLoad !== defaultLang) {
                    console.warn(`Workspace failed for ${attemptUrl} (${response.status}). Attempting fallback to ${defaultLang}.`);
                    const fallbackUrl = baseUrl.replace('{lang}', defaultLang);
                    response = await fetch(`${fallbackUrl}?v=${Date.now()}`);
                    if (response.ok) {
                        console.log(`Fallback successful for ${fallbackUrl}`);
                        loadedLang = defaultLang;
                        if (baseUrl.includes('ui_')) { actualLoadedUiLang = defaultLang; console.log(`UI fallback successful, actual loaded language set to: ${actualLoadedUiLang}`);}
                    } else { console.error(`Fallback fetch failed for ${fallbackUrl}: ${response.status}`); return { data: null, loadedLang: null }; }
                } else if (!response.ok) { console.error(`HTTP error fetching ${attemptUrl}: ${response.status} ${response.statusText}`); return { data: null, loadedLang: null }; }
                const jsonData = await response.json();
                return { data: jsonData, loadedLang: loadedLang };
            } catch (error) { console.error(`Failed to load or parse ${attemptUrl} (or its fallback):`, error); return { data: null, loadedLang: null }; }
        };

        try {
            const [uiResult, projectsResult, patentsResult, publicationsResult] = await Promise.all([
                fetchJson('data/ui_{lang}.json', true), fetchJson('data/projects_{lang}.json', true), fetchJson('data/patents_{lang}.json', true), fetchJson(publicationsFile, false)
            ]);
            if (!uiResult.data || !projectsResult.data || !patentsResult.data || !publicationsResult.data) { throw new Error(`Essential data files could not be loaded.`); }
            currentLang = actualLoadedUiLang;
            loadedData = { ui: uiResult.data, projects: projectsResult.data, patents: patentsResult.data, publications: publicationsResult.data };
            console.log(`Successfully loaded all data. Effective UI language: ${currentLang}`);
            return loadedData;
        } catch (error) {
            console.error("Failed to load all required data:", error);
            const errorMsg = 'Error loading website content. Please try again later.';
            if(projectsListContainer) projectsListContainer.innerHTML = `<p style="color: red;">${errorMsg}</p>`;
            if (publicationsListAllContainer) publicationsListAllContainer.innerHTML = `<p style="color: red;">${errorMsg}</p>`;
            loadedData = {}; currentLang = defaultLang; return null;
        }
    }

    function renderPage(allData) {
        if (!allData || !allData.ui) { console.error("Cannot render page: UI data is missing."); return; }
        const data = allData.ui;

        htmlEl.lang = currentLang; titleEl.textContent = data.meta.title; metaDescriptionEl.setAttribute('content', data.meta.description);
        headerNameEl.textContent = data.header.name; langSwitchBtn.textContent = data.nav.lang_switch_text; langSwitchBtn.dataset.targetLang = data.nav.lang_switch_target; langSwitchBtn.setAttribute('aria-label', `Switch language to ${getLanguageName(data.nav.lang_switch_target)}`);
        introParagraphEl.innerHTML = data.intro.text;

        if (teaserSectionEl) { if (data.teaser && data.teaser.show_teaser === true) { teaserSectionEl.style.display = ''; if (teaserAnimEl) teaserAnimEl.alt = data.teaser.alt_text || ''; } else { teaserSectionEl.style.display = 'none'; } }
        if (categoriesTitleEl) categoriesTitleEl.textContent = data.sections.categories;
        if (patentsTitleEl) patentsTitleEl.textContent = data.sections.patents;
        // contactTitleEl removed
        // publicationsListTitleEl removed
        if (tabBtnProjects) tabBtnProjects.textContent = data.ui_text.tab_projects || 'Projects';
        if (tabBtnPublications) tabBtnPublications.textContent = data.ui_text.tab_publications || 'Publications';
        if (tabBtnServices) tabBtnServices.textContent = data.ui_text.tab_services || 'Services';
        if (tabBtnContact) tabBtnContact.textContent = data.ui_text.tab_contact || 'Contact';
        if (servicesTitleEl) servicesTitleEl.textContent = data.services_pane_title || '';
        if (servicesContentEl) servicesContentEl.innerHTML = data.services_description_html || '';

        renderCategories(data.categories || [], currentLang);
        renderProjects(allData.projects || [], data.categories || [], data.institutions || [], allData.publications || [], allData.patents || [], data.ui_text || {}, currentFilter);
        renderAllPublications(allData.publications || [], data.ui_text || {});
        renderPatents(allData.patents || [], data.ui_text || {});
        renderContact(data.contact || {});

        if (footerCopyrightEl) { const year = new Date().getFullYear(); const formatString = data.footer_copyright_text || `© ${year} Fumitoshi Matsulić. All rights reserved.`; footerCopyrightEl.textContent = formatString.replace('{year}', year); }
        updateActiveCategoryButton(currentFilter);
        updateActiveTab(currentTab);
    }

    function renderCategories(categories, lang) {
        if (!categoryFilterContainer) return; categoryFilterContainer.innerHTML = '';
        categories.forEach(cat => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.categoryId = cat.id;
            const logoHTML = cat.logo ? `<img src="${cat.logo}" alt="" loading="lazy">` : '';
            button.innerHTML = `${logoHTML} ${cat.name || cat.id}`;
            button.addEventListener('click', () => handleFilterClick(cat.id));
            categoryFilterContainer.appendChild(button);
        });
        updateActiveCategoryButton(currentFilter);
    }

    function renderInstitutions(institutions) {}

    function renderProjects(projects, categoriesDef, institutionsDef, allPublications, allPatents, uiText, filterCategory) {
        if (!projectsListContainer) return;
        projectsListContainer.innerHTML = '';
        const filteredProjects = projects.filter(project => filterCategory === 'all' || (project.categories && project.categories.includes(filterCategory)));
        if (filteredProjects.length === 0) { projectsListContainer.innerHTML = `<p>${uiText.no_projects_found || 'No projects found for this category.'}</p>`; return; }
        const fragment = document.createDocumentFragment();
        filteredProjects.forEach(project => {
            const card = document.createElement('article'); card.classList.add('project-card'); card.dataset.projectId = project.id;
            const institution = institutionsDef.find(inst => inst.id === project.institution_id);
            let imagesHTML = ''; if (project.images && project.images.length > 0) { imagesHTML = `<div class="project-images">${project.images.map((img, index) => `<img src="${img}" alt="Project image ${index + 1} for ${escapeAttribute(project.title || 'Untitled Project')}" loading="lazy">`).join('')}</div>`; }
            let headerInfoHTML = '<div class="project-header-info">'; if (project.categories && project.categories.length > 0) { headerInfoHTML += `<div class="project-categories">${project.categories.map(catId => { const category = categoriesDef.find(c => c.id === catId); return `<span>${category ? category.name : catId}</span>`; }).join('')}</div>`; } if (institution && institution.url && institution.logo) { headerInfoHTML += `<div class="project-institution"><a href="${institution.url}" target="_blank" rel="noopener noreferrer" title="${institution.name || ''}"><img src="${institution.logo}" alt="${institution.name || ''} Logo" loading="lazy"></a></div>`; } headerInfoHTML += '</div>';
            let publicationsHTML = '';
            if (project.publication_ids && project.publication_ids.length > 0) {
                const projectPubs = project.publication_ids.map(pubId => allPublications.find(p => p.id === pubId) || allPatents.find(p => p.id === pubId)).filter(pub => pub !== undefined);
                if (projectPubs.length > 0) {
                    publicationsHTML = `<div class="project-publications"><h5>${uiText.publications || 'Related Publications:'}</h5><ul>`;
                    publicationsHTML += projectPubs.map(pub => {
                        let primaryLinkIcon = ''; const linkText = getLinkTextForPubType(pub.type, uiText); const linkTarget = pub.pdf && pub.pdf.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : '';
                        const primaryLinkLabel = escapeAttribute(getPublicationActionLabel(linkText, pub));
                        const videoLinkLabel = escapeAttribute(getPublicationActionLabel(uiText.video || 'Video', pub));
                        const doiLinkLabel = escapeAttribute(getPublicationActionLabel(uiText.doi || 'DOI', pub));
                        if (pub.pdf) {
                            switch (pub.type) {
                                case 'patent': primaryLinkIcon = `<a href="${pub.pdf}" ${linkTarget} title="${primaryLinkLabel}" aria-label="${primaryLinkLabel}"><img src="img/icons/patent.png" alt="" class="link-icon"></a>`; break;
                                case 'link': primaryLinkIcon = `<a href="${pub.pdf}" ${linkTarget} title="${primaryLinkLabel}" aria-label="${primaryLinkLabel}"><img src="img/icons/link.png" alt="" class="link-icon"></a>`; break;
                                case 'thesis': primaryLinkIcon = `<a href="${pub.pdf}" ${linkTarget} title="${primaryLinkLabel}" aria-label="${primaryLinkLabel}"><img src="img/icons/pdf.png" alt="" class="link-icon"></a>`; break;
                                default: primaryLinkIcon = `<a href="${pub.pdf}" ${linkTarget} title="${primaryLinkLabel}" aria-label="${primaryLinkLabel}"><img src="img/icons/pdf.png" alt="" class="link-icon"></a>`; break;
                            }
                        }
                        const videoLinkIcon = pub.video ? `<a href="${pub.video}" target="_blank" ${pub.video.startsWith('http') ? 'rel="noopener noreferrer"' : ''} title="${videoLinkLabel}" aria-label="${videoLinkLabel}"><img src="img/icons/video.png" alt="" class="link-icon"></a>` : '';
                        const doiLinkText = pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener noreferrer" title="${doiLinkLabel}" aria-label="${doiLinkLabel}">${uiText.doi || 'DOI'}</a>` : '';
                        return `<li class="pub-type-${pub.type || 'unknown'}" style="--item-icon: '${getIconForPubType(pub.type)}';"> <span class="pub-title">${pub.title || 'Untitled'}</span> ${pub.authors ? `<span class="pub-authors">${pub.authors}</span>` : ''} ${pub.venue ? `<span class="pub-venue">${pub.venue}${pub.year ? ', ' + pub.year : ''}</span>` : (pub.year ? `<span class="pub-venue">${pub.year}</span>` : '')} <div class="pub-links"> ${primaryLinkIcon} ${videoLinkIcon} ${doiLinkText} </div> ${pub.notes ? `<span class="pub-notes">${pub.notes}</span>` : ''} </li>`;
                    }).join('');
                    publicationsHTML += `</ul></div>`;
                }
            }
            card.innerHTML = `<h4>${project.title || 'Untitled Project'}</h4> ${imagesHTML} ${headerInfoHTML} <p class="project-description">${project.description || ''}</p> ${publicationsHTML}`;
            fragment.appendChild(card);
        });
        projectsListContainer.appendChild(fragment);
    }

    function getIconForPubType(type) {
        switch (type) { case 'patent': return '⚖️'; case 'link': return '🔗'; case 'thesis': return '🎓'; case 'poster': return '📊'; case 'demo': return '🕹️'; case 'workshop': return '🛠️'; case 'paper': default: return '📄'; }
    }
    function getLinkTextForPubType(type, uiText){
         switch (type) { case 'patent': return uiText.patent_link || 'Patent'; case 'link': return uiText.link_link || 'Link'; case 'thesis': return uiText.thesis_link || 'Thesis'; default: return uiText.pdf || 'PDF'; }
    }

    function renderAllPublications(publications, uiText) {
        if (!publicationsListAllContainer) return;
        // publicationsListTitleEl removed
        publicationsListAllContainer.innerHTML = '';
        const filteredPubs = publications.filter(p => p.type !== 'patent' && p.type !== 'link');
        if (!filteredPubs || filteredPubs.length === 0) { publicationsListAllContainer.innerHTML = `<li>${uiText.no_publications_listed || 'No publications listed.'}</li>`; return; }
        const sortedPubs = [...filteredPubs].sort((a, b) => { return (b.year || 0) - (a.year || 0); });
        const fragment = document.createDocumentFragment(); let currentYear = null;
        sortedPubs.forEach(pub => {
             if(pub.year && pub.year !== currentYear) { currentYear = pub.year; const yearLi = document.createElement('li'); yearLi.classList.add('year-header'); yearLi.innerHTML = `<span class="pub-year" role="heading" aria-level="3">${currentYear}</span>`; fragment.appendChild(yearLi); }
             else if (!pub.year && currentYear !== 'unknown') { currentYear = 'unknown'; const yearLi = document.createElement('li'); yearLi.classList.add('year-header'); yearLi.innerHTML = `<span class="pub-year" role="heading" aria-level="3">${uiText.unknown_year || 'Unknown Year'}</span>`; fragment.appendChild(yearLi); }
             const li = document.createElement('li'); const icon = getIconForPubType(pub.type); const linkText = getLinkTextForPubType(pub.type, uiText); li.style.setProperty('--item-icon', `"${icon}"`); li.classList.add(`pub-type-${pub.type || 'unknown'}`);
             const pdfLinkLabel = escapeAttribute(getPublicationActionLabel(linkText, pub));
             const videoLinkLabel = escapeAttribute(getPublicationActionLabel(uiText.video || 'Video', pub));
             const doiLinkLabel = escapeAttribute(getPublicationActionLabel(uiText.doi || 'DOI', pub));
             const pdfLinkIcon = pub.pdf ? `<a href="${pub.pdf}" target="_blank" ${pub.pdf.startsWith('http') ? 'rel="noopener noreferrer"' : ''} title="${pdfLinkLabel}" aria-label="${pdfLinkLabel}"><img src="img/icons/pdf.png" alt="" class="link-icon"></a>` : '';
             const videoLinkIcon = pub.video ? `<a href="${pub.video}" target="_blank" ${pub.video.startsWith('http') ? 'rel="noopener noreferrer"' : ''} title="${videoLinkLabel}" aria-label="${videoLinkLabel}"><img src="img/icons/video.png" alt="" class="link-icon"></a>` : '';
             const doiLinkText = pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener noreferrer" title="${doiLinkLabel}" aria-label="${doiLinkLabel}">${uiText.doi || 'DOI'}</a>` : '';
             li.innerHTML = `<div class="pub-details"> <span class="pub-title">${pub.title || 'Untitled'}</span> ${pub.authors ? `<span class="pub-authors">${pub.authors}</span>` : ''} ${pub.venue ? `<span class="pub-venue">${pub.venue}</span>` : ''} <div class="pub-links"> ${pdfLinkIcon} ${videoLinkIcon} ${doiLinkText} </div> ${pub.notes ? `<span class="pub-notes">${pub.notes}</span>` : ''} </div>`;
             fragment.appendChild(li);
        });
        publicationsListAllContainer.appendChild(fragment);
    }

    function renderPatents(patents, uiText) {
        if (!patentsListContainer || !patentsTitleEl) return;
       patentsListContainer.innerHTML = '';
       if (!patents || patents.length === 0) { patentsTitleEl.style.display = 'none'; return; }
       patentsTitleEl.style.display = 'block'; patentsTitleEl.textContent = uiText.patents_section_title || "Patents";
       const fragment = document.createDocumentFragment(); const sortedPatents = [...patents].sort((a,b) => (b.year || 0) - (a.year || 0) || (a.title || '').localeCompare(b.title || ''));
       sortedPatents.forEach(patent => {
           const li = document.createElement('li'); const icon = getIconForPubType('patent'); li.style.setProperty('--item-icon', `"${icon}"`); li.classList.add(`pub-type-patent`);
           const patentLinkLabel = escapeAttribute(getPublicationActionLabel(uiText.patent_link || 'Patent Link', patent));
           const patentLinkIcon = patent.pdf ? `<a href="${patent.pdf}" target="_blank" rel="noopener noreferrer" title="${patentLinkLabel}" aria-label="${patentLinkLabel}"><img src="img/icons/patent.png" alt="" class="link-icon"></a>` : '';
           li.innerHTML = `<div class="pub-details"> <span class="patent-title pub-title">${patent.title || 'Untitled Patent'}</span> <span class="patent-details pub-venue"> ${patent.venue || patent.number || ''} ${patent.date ? ` (${patent.date})` : (patent.year ? ` (${patent.year})` : '')} </span> ${patent.notes ? `<p class="patent-notes">${patent.notes}</p>` : ''} <div class="pub-links"> ${patentLinkIcon} </div> </div>`;
           fragment.appendChild(li);
       });
       patentsListContainer.appendChild(fragment);
    }

    function renderContact(contact) {
         if (!contactDetailsContainer) return;
         let contactHTML = '';
         if (contact.email) { const displayEmail = contact.email.replace('@', ' [at] '); const mailtoEmail = getMailtoAddress(contact.email); contactHTML += `<p>Email: <a href="mailto:${mailtoEmail}" aria-label="Email Fabrice Matulic">${displayEmail}</a></p>`; }
         if (contact.linkedin) { const profileName = contact.linkedin.split('/').filter(Boolean).pop() || 'Profile'; contactHTML += `<p>LinkedIn: <a href="${contact.linkedin}" target="_blank" rel="noopener noreferrer">${profileName}</a></p>`; }
         if (contact.address) { contactHTML += `<p>Address:<br>${contact.address}</p>`; }
         contactDetailsContainer.innerHTML = contactHTML;
     }


    // --- Event Handlers ---
    function handleFilterClick(categoryId) {
        if (!categoryFilterContainer) return; currentFilter = categoryId; console.log(`Filtering by: ${currentFilter}`);
        const { projects, ui, publications, patents } = loadedData;
        if (projects && ui && publications && patents) {
            renderProjects(projects, ui.categories || [], ui.institutions || [], publications, patents, ui.ui_text || {}, currentFilter);
            updateActiveCategoryButton(currentFilter);
            const activeCategory = (ui.categories || []).find(cat => cat.id === currentFilter);
            const filteredCount = projects.filter(project => currentFilter === 'all' || (project.categories && project.categories.includes(currentFilter))).length;
            announceStatus(`Showing ${filteredCount} project${filteredCount === 1 ? '' : 's'}${activeCategory ? ` in ${activeCategory.name}` : ''}.`);
        }
        else { console.warn("Cannot filter projects, data not fully loaded."); }
        syncStateAndHash('projects-view', true);
    }
    function updateActiveCategoryButton(activeCategoryId) {
        if (!categoryFilterContainer) return; const buttons = categoryFilterContainer.querySelectorAll('button'); buttons.forEach(button => { const isActive = button.dataset.categoryId === activeCategoryId; button.classList.toggle('active', isActive); button.setAttribute('aria-pressed', String(isActive)); });
    }

    // --- Tab UI Update Function ---
    function updateActiveTab(activeTabId) {
        const viewIds = ['projects-view', 'publications-view', 'services-view', 'contact-view'];
        tabButtons.forEach((button, index) => {
            if (!button) return;
            const isActive = activeTabId === viewIds[index];
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            button.tabIndex = isActive ? 0 : -1;
        });
        tabPanes.forEach((pane, index) => {
            if (!pane) return;
            const isActive = activeTabId === viewIds[index];
            pane.classList.toggle('active', isActive);
            pane.hidden = !isActive;
        });
    }


    // --- Core State and URL Synchronization Logic ---
    function parseHash(hash) {
        let lang = defaultLang; let tabName = defaultTabName; const parts = hash.substring(1).split('/');
        if (parts.length === 1) { if (validLangs.includes(parts[0])) { lang = parts[0]; } else if (validTabNames.includes(parts[0])) { tabName = parts[0]; } }
        else if (parts.length >= 2) { if (validLangs.includes(parts[0])) { lang = parts[0]; } if (validTabNames.includes(parts[1])) { tabName = parts[1]; } }
        if (!validTabNames.includes(tabName)) { tabName = defaultTabName; } return { lang, tabName };
    }
    function syncUIState(targetLang, targetTabName) {
         if (!validTabNames.includes(targetTabName)) { targetTabName = defaultTabName; } const targetTabViewId = `${targetTabName}-view`; let langChanged = false;
         if (validLangs.includes(targetLang) && targetLang !== currentLang) { currentLang = targetLang; langChanged = true; console.log(`UI State Sync: Language changed to ${currentLang}`); }
         if (validTabViewIds.includes(targetTabViewId) && targetTabViewId !== currentTab) { currentTab = targetTabViewId; console.log(`UI State Sync: Tab changed to ${currentTab}`); }
         else if (!validTabViewIds.includes(targetTabViewId)) { console.warn(`Invalid target tab view ID '${targetTabViewId}', defaulting to projects-view.`); currentTab = 'projects-view'; }
         updateActiveTab(currentTab); return langChanged;
    }
    function updateURLHash() {
        const baseTabName = currentTab.replace('-view', ''); const newHash = `#${currentLang}/${baseTabName}`;
        if (window.location.hash !== newHash) { console.log(`Updating URL hash to: ${newHash}`); window.history.pushState({ lang: currentLang, tab: currentTab }, "", newHash); }
    }
    function syncStateAndHash(targetTabViewId, updateHash = false) {
         if (!validTabViewIds.includes(targetTabViewId)) { targetTabViewId = 'projects-view'; } const targetTabName = targetTabViewId.replace('-view','');
        const langChanged = syncUIState(currentLang, targetTabName); if (updateHash && !langChanged) { updateURLHash(); }
    }
    function handleTabClick(tabId) {
        syncStateAndHash(tabId, true);
        const activeButton = tabButtons.find(button => button && button.getAttribute('aria-controls') === tabId);
        if (activeButton) announceStatus(`${activeButton.textContent} selected.`);
    }
    function handleTabKeydown(event) {
        const enabledButtons = tabButtons.filter(Boolean);
        const currentIndex = enabledButtons.indexOf(event.currentTarget);
        if (currentIndex === -1) return;
        let nextIndex = null;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % enabledButtons.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                nextIndex = (currentIndex - 1 + enabledButtons.length) % enabledButtons.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = enabledButtons.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        const nextButton = enabledButtons[nextIndex];
        nextButton.focus();
        handleTabClick(nextButton.getAttribute('aria-controls'));
    }
    async function handleHashChange() {
        console.log(`Hash change detected: ${window.location.hash}`); const { lang: targetLang, tabName: targetTabName } = parseHash(window.location.hash);
        const langActuallyChanged = syncUIState(targetLang, targetTabName);
        if (langActuallyChanged) {
            console.log(`Hash change caused language change to ${currentLang}. Reloading data...`); currentFilter = 'all';
            const newData = await loadAllData(currentLang); if (newData) { renderPage(newData); }
        } else { console.log(`Hash change only affected tab (or was invalid). UI already updated.`); }
    }
    async function handleLangSwitch() {
        if (!langSwitchBtn) return; const targetLang = langSwitchBtn.dataset.targetLang; const initialCurrentLang = currentLang;
        if (targetLang === initialCurrentLang) { console.log(`Language already set to ${initialCurrentLang}. No switch needed.`); updateURLHash(); return; }
        console.log(`Switching language TO: ${targetLang} (from ${initialCurrentLang})`); currentFilter = 'all';
        currentLang = targetLang; updateURLHash();
        const newData = await loadAllData(currentLang);
        if (newData) { determineInitialState(); updateURLHash(); renderPage(newData); }
        else { currentLang = initialCurrentLang; console.error(`Failed to load data for target language ${targetLang}. Reverting language state to ${currentLang}.`); updateURLHash(); }
    }

    // --- Initialization ---
    function determineInitialState() {
        const initialState = parseHash(window.location.hash); currentLang = initialState.lang; currentTab = `${initialState.tabName}-view`; if (!validTabViewIds.includes(currentTab)) { currentTab = 'projects-view'; } console.log(`Initial state: lang=${currentLang}, tab=${currentTab}`);
    }
    async function initializePage() {
        determineInitialState();
        const initialData = await loadAllData(currentLang);
        if (initialData) {
            renderPage(initialData);
            if (langSwitchBtn) langSwitchBtn.addEventListener('click', handleLangSwitch);
            if (tabBtnProjects) tabBtnProjects.addEventListener('click', () => handleTabClick('projects-view'));
            if (tabBtnPublications) tabBtnPublications.addEventListener('click', () => handleTabClick('publications-view'));
            if (tabBtnServices) tabBtnServices.addEventListener('click', () => handleTabClick('services-view')); // Add listener
            if (tabBtnContact) tabBtnContact.addEventListener('click', () => handleTabClick('contact-view'));
            tabButtons.forEach(button => { if (button) button.addEventListener('keydown', handleTabKeydown); });
            window.addEventListener('hashchange', handleHashChange);
        } else { console.error("Initialization failed: Could not load initial data."); }
    }
    initializePage();
});
