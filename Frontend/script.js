document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM fully loaded');

    let cases = [];

    // Elements for pre-login and dashboard
    const preLoginHeader = document.getElementById('preLoginHeader');
    const preLoginMain = document.getElementById('preLoginMain');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signinBtn = document.getElementById('signinBtn');
    const signupBtn = document.getElementById('signupBtn');

    // Initialize login/signup toggle
    function initializeAuthToggle() {
        if (loginForm && signupForm && signinBtn && signupBtn) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            signinBtn.classList.add('active');
            signupBtn.classList.remove('active');
            console.log('Initialized auth toggle: Sign In visible');
        } else {
            console.error('Auth elements not found');
        }
    }

    // Pre-Login Tab Navigation
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            document.querySelectorAll('#preLoginMain .content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
                console.log('Switched to pre-login section:', sectionId);
                loadSectionContent(sectionId); // Always reload content
            } else {
                console.error(`Section ${sectionId} not found`);
            }
            this.classList.add('active');
        });
    });

    // Load content for a specific section
    function loadSectionContent(sectionId) {
        const targetSection = document.getElementById(sectionId === 'home' ? 'homePreLogin' : `${sectionId}PreLogin`);
        if (!targetSection) return;

        switch (sectionId) {
            case 'home':
                fetchCases();
                targetSection.style.display = 'block'; // Ensure visibility
                break;
            case 'search':
                const searchForm = document.getElementById('advancedSearchFormPreLogin');
                if (searchForm) {
                    searchForm.style.display = 'block';
                    console.log('Advanced Search form displayed');
                }
                targetSection.style.display = 'block';
                break;
            case 'about':
                fetchAboutContent('mission');
                document.querySelectorAll('.about-button').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-tab') === 'mission');
                });
                fetchTeamMembers();
                targetSection.style.display = 'block';
                break;
            case 'cases':
                displayCasesByCounty();
                targetSection.style.display = 'block';
                break;
            case 'login':
                initializeAuthToggle();
                targetSection.style.display = 'block';
                break;
        }
    }

    // Dashboard Sidebar Navigation
    document.querySelectorAll('.sidebar li').forEach(link => {
        link.addEventListener('click', function () {
            const sectionId = this.getAttribute('data-tab');
            if (sectionId) {
                document.querySelectorAll('.sidebar li:not(#logoutBtn)').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.dashboard-content .content').forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                const targetSection = document.getElementById(sectionId);
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
                this.classList.add('active');
                console.log('Switched to dashboard section:', sectionId);
                if (sectionId === 'cases') {
                    displayCasesByCounty();
                } else if (sectionId === 'home') {
                    fetchCases();
                } else if (sectionId === 'about') {
                    fetchAboutContent('mission');
                    fetchTeamMembers();
                } else if (sectionId === 'constitution') {
                    fetchConstitution();
                }
            }
        });
    });

    // Fetch cases and display overview
    async function fetchCases() {
        try {
            console.log('Fetching cases from http://localhost:5000/cases');
            const response = await fetch('http://localhost:5000/cases', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${await response.text()}`);
            }
            cases = await response.json();
            console.log('Cases fetched successfully:', cases);
            displayOverview(cases);
            if (document.getElementById('cases')?.classList.contains('active') || document.getElementById('casesPreLogin')?.classList.contains('active')) {
                displayCasesByCounty();
            }
        } catch (error) {
            console.error('Fetch cases error:', error);
            const overviewElement = isLoggedIn() ? 'caseOverview' : 'caseOverviewPreLogin';
            document.getElementById(overviewElement).innerHTML = `<p>Error loading overview: ${error.message}</p>`;
        }
    }

    // Display overview metrics
    function displayOverview(caseArray) {
        const overviewElement = isLoggedIn() ? 'caseOverview' : 'caseOverviewPreLogin';
        const listElement = isLoggedIn() ? 'caseList' : 'caseListPreLogin';
        const caseOverview = document.getElementById(overviewElement);
        const caseList = document.getElementById(listElement);
        if (!caseOverview || !caseList) {
            console.error('Overview or list element not found');
            return;
        }
        caseList.style.display = 'none';
        caseOverview.style.display = 'block';

        if (caseArray.length === 0) {
            caseOverview.innerHTML = "<p>No cases available.</p>";
            return;
        }

        const uniqueCases = caseArray.length;
        const courts = [...new Set(caseArray.map(caseItem => caseItem.court || 'Unknown'))].length;
        const judges = [...new Set(caseArray.map(caseItem => caseItem.judge || 'Unknown'))].length;
        const pagesScanned = 876924;
        const reporters = 87;

        caseOverview.innerHTML = `
            <p><strong>Number of Unique Cases:</strong> ${uniqueCases}</p>
            <p><strong>Number of Courts:</strong> ${courts}</p>
            <p><strong>Number of Judges:</strong> ${judges}</p>
            <p><strong>Number of Pages Scanned:</strong> ${pagesScanned}</p>
            <p><strong>Number of Reporters:</strong> ${reporters}</p>
        `;
    }

    // Display cases as clickable links
    function displayCases(caseArray) {
        const overviewElement = isLoggedIn() ? 'caseOverview' : 'caseOverviewPreLogin';
        const listElement = isLoggedIn() ? 'caseList' : 'caseListPreLogin';
        const caseOverview = document.getElementById(overviewElement);
        const caseList = document.getElementById(listElement);
        caseOverview.style.display = 'none';
        caseList.style.display = 'block';
        caseList.innerHTML = "";

        if (caseArray.length === 0) {
            caseList.innerHTML = "<p>No cases found.</p>";
            return;
        }

        caseArray.forEach(caseItem => {
            const li = document.createElement("li");
            li.textContent = `${caseItem.title || 'Untitled'} - ${caseItem.county || 'N/A'}`;
            li.addEventListener('click', () => {
                localStorage.setItem('selectedCase', JSON.stringify(caseItem));
                window.location.href = 'case-details.html';
            });
            caseList.appendChild(li);
        });
    }

    // Display cases by county with clickable items
    function displayCasesByCounty() {
        const countyElement = isLoggedIn() ? 'casesByCounty' : 'casesByCountyPreLogin';
        const casesByCountyList = document.getElementById(countyElement);
        casesByCountyList.innerHTML = "";
        if (cases.length === 0) {
            casesByCountyList.innerHTML = "<p>No cases found.</p>";
            return;
        }
        const casesByCounty = {};
        cases.forEach(caseItem => {
            const county = caseItem.county || 'Unknown';
            if (!casesByCounty[county]) {
                casesByCounty[county] = [];
            }
            casesByCounty[county].push(caseItem);
        });
        for (const [county, countyCases] of Object.entries(casesByCounty)) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${county} (${countyCases.length} cases)</strong>`;
            const ul = document.createElement('ul');
            countyCases.forEach(caseItem => {
                const caseLi = document.createElement('li');
                caseLi.textContent = caseItem.title || 'Untitled';
                caseLi.style.cursor = 'pointer';
                caseLi.addEventListener('click', () => {
                    localStorage.setItem('selectedCase', JSON.stringify(caseItem));
                    window.location.href = 'case-details.html';
                });
                ul.appendChild(caseLi);
            });
            li.appendChild(ul);
            casesByCountyList.appendChild(li);
        }
    }

    // Simple Search
    function setupSearch(inputId, buttonId) {
        document.getElementById(buttonId).addEventListener('click', function () {
            const query = document.getElementById(inputId).value.trim();
            if (query) performSearch(query);
            else alert("Please enter a search query.");
        });

        document.getElementById(inputId).addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) performSearch(query);
            }
        });
    }

    setupSearch('searchInputPreLogin', 'searchButtonPreLogin');
    setupSearch('searchInput', 'searchButton');

    async function performSearch(query) {
        try {
            const response = await fetch(`http://localhost:5000/cases/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const results = await response.json();
            displayCases(results);
        } catch (error) {
            const listElement = isLoggedIn() ? 'caseList' : 'caseListPreLogin';
            const caseList = document.getElementById(listElement);
            caseList.style.display = 'block';
            caseList.innerHTML = `<p>Error searching cases: ${error.message}</p>`;
        }
    }

    // Advanced Search
    function setupAdvancedSearch(formId) {
        const form = document.getElementById(formId);
        if (form) {
            console.log(`Advanced Search form ${formId} found, adding event listener`);
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                const formData = new FormData(this);
                const params = new URLSearchParams();
                for (const [key, value] of formData) {
                    if (value) params.append(key, value);
                }
                console.log('Sending advanced search request with params:', params.toString());

                const isPreLogin = formId === 'advancedSearchFormPreLogin';
                const responseElement = document.getElementById(isPreLogin ? 'searchResponsePreLogin' : 'searchResponse');
                const resultsElement = document.getElementById(isPreLogin ? 'searchResultsPreLogin' : 'searchResults');

                try {
                    responseElement.style.display = 'block';
                    responseElement.style.color = '#3b82f6';
                    responseElement.textContent = 'Searching...';

                    const response = await fetch(`http://localhost:5000/cases/search?${params.toString()}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(localStorage.getItem('token') && !isPreLogin ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Advanced search failed: ${response.status} - ${errorText}`);
                    }

                    const results = await response.json();
                    responseElement.textContent = `Found ${results.length} cases`;

                    resultsElement.innerHTML = '';
                    if (results.length === 0) {
                        resultsElement.innerHTML = '<p>No cases found.</p>';
                    } else {
                        results.forEach(caseItem => {
                            const div = document.createElement('div');
                            div.className = 'result-item';
                            div.innerHTML = `
                                <h3>${caseItem.title || 'Untitled'}</h3>
                                <p>Case Number: ${caseItem.case_number || 'N/A'}</p>
                                <p>Judge: ${caseItem.judge || 'N/A'}</p>
                                <p>Date of Judgment: ${caseItem.date_of_judgment || 'N/A'}</p>
                            `;
                            div.style.cursor = 'pointer';
                            div.addEventListener('click', () => {
                                localStorage.setItem('selectedCase', JSON.stringify(caseItem));
                                window.location.href = 'case-details.html';
                            });
                            resultsElement.appendChild(div);
                        });
                    }
                } catch (error) {
                    console.error('Error in advanced search:', error);
                    responseElement.style.display = 'block';
                    responseElement.style.color = '#ff4500';
                    responseElement.textContent = `Error: ${error.message}`;
                    resultsElement.innerHTML = '';
                }
            });
        } else {
            console.error(`Advanced Search form ${formId} not found`);
        }
    }

    setupAdvancedSearch('advancedSearchFormPreLogin');
    setupAdvancedSearch('advancedSearchForm');

    // Login
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        console.log('Login form submitted');
        e.preventDefault();
        const formData = new FormData(this);
        const formDataObj = Object.fromEntries(formData);
        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                body: JSON.stringify(formDataObj),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');
            localStorage.setItem('token', data.token);
            console.log('Login successful, token stored:', data.token);
            alert('Login successful');
            updateInterfaceForLoggedInUser();
        } catch (error) {
            console.error('Login error:', error);
            alert(`Login error: ${error.message}`);
        }
    });

    // Register
    signinBtn.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        signinBtn.classList.add('active');
        signupBtn.classList.remove('active');
    });

    signupBtn.addEventListener('click', () => {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        signupBtn.classList.add('active');
        signinBtn.classList.remove('active');
    });

    document.getElementById('signupForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        try {
            const response = await fetch('http://localhost:5000/auth/register', {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData)),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            alert('Registration successful. Please sign in.');
            initializeAuthToggle();
        } catch (error) {
            alert(`Registration error: ${error.message}`);
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        updateInterfaceForLoggedInUser();
    });

    // Update interface based on login status
    function updateInterfaceForLoggedInUser() {
        if (isLoggedIn()) {
            preLoginHeader.style.display = 'none';
            preLoginMain.style.display = 'none';
            dashboard.style.display = 'flex';
            document.getElementById('casesTab').style.display = 'block';
            document.querySelectorAll('.dashboard-content .content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            const homeSection = document.getElementById('home');
            homeSection.classList.add('active');
            homeSection.style.display = 'block';
            document.querySelector('.sidebar li[data-tab="home"]').classList.add('active');
            fetchCases();
        } else {
            preLoginHeader.style.display = 'flex';
            preLoginMain.style.display = 'flex';
            dashboard.style.display = 'none';
            document.getElementById('casesTab').style.display = 'none';
            document.querySelectorAll('#preLoginMain .content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            const homeSection = document.getElementById('homePreLogin');
            homeSection.classList.add('active');
            homeSection.style.display = 'block';
            document.querySelector('.tab-link[href="#home"]').classList.add('active');
            document.querySelectorAll('.tab-link').forEach(t => {
                if (t.getAttribute('href') !== '#home') t.classList.remove('active');
            });
            initializeAuthToggle();
            // Load all pre-login content on logout or initial load
            ['home', 'search', 'about'].forEach(sectionId => {
                loadSectionContent(sectionId);
                document.getElementById(sectionId === 'home' ? 'homePreLogin' : `${sectionId}PreLogin`).style.display = sectionId === 'home' ? 'block' : 'none';
            });
        }
    }

    function isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    // Footer adjustment
    function adjustFooter() {
        const footer = document.querySelector('footer');
        if (document.body.offsetHeight < window.innerHeight) {
            footer.style.position = "absolute";
            footer.style.bottom = "0";
            footer.style.width = "100%";
        } else {
            footer.style.position = "relative";
        }
    }

    adjustFooter();
    window.addEventListener('resize', adjustFooter);

    // About page content fetching
    const aboutButtons = document.querySelectorAll('.about-button');
    function fetchAboutContent(tabId) {
        const contentElement = isLoggedIn() ? 'aboutContent' : 'aboutContentPreLogin';
        const aboutContent = document.getElementById(contentElement);
        if (!aboutContent) {
            console.error(`About content element ${contentElement} not found`);
            return;
        }
        fetch(`http://localhost:5000/api/about/${tabId}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch ${tabId} content`);
                return response.json();
            })
            .then(data => {
                aboutContent.innerHTML = `<h3>${data.title}</h3><p>${data.content}</p>`;
                aboutContent.style.display = 'block';
                console.log(`Loaded ${tabId} content`);
            })
            .catch(error => {
                aboutContent.innerHTML = `<h3>Error</h3><p>Unable to load content: ${error.message}</p>`;
                aboutContent.style.display = 'block';
            });
    }

    aboutButtons.forEach(button => {
        button.addEventListener('click', function () {
            aboutButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            fetchAboutContent(this.getAttribute('data-tab'));
        });
    });

    // Fetch team members
    function fetchTeamMembers() {
        const teamElement = isLoggedIn() ? 'teamMembers' : 'teamMembersPreLogin';
        const teamContainer = document.getElementById(teamElement);
        if (!teamContainer) {
            console.error(`Team element ${teamElement} not found`);
            return;
        }
        fetch('http://localhost:5000/api/about/team-members')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch team members');
                return response.json();
            })
            .then(members => {
                teamContainer.innerHTML = '';
                members.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.classList.add('team-member');
                    memberDiv.innerHTML = `
                        <img src="http://localhost:5000${member.image}" alt="${member.name}">
                        <h4>${member.name}</h4>
                        <p class="role">${member.role}</p>
                        <p class="bio">${member.bio}</p>
                    `;
                    teamContainer.appendChild(memberDiv);
                });
                teamContainer.parentElement.style.display = 'block';
                console.log('Team members loaded');
            })
            .catch(error => {
                teamContainer.innerHTML = `<p>Error loading team members: ${error.message}</p>`;
                teamContainer.parentElement.style.display = 'block';
            });
    }

    // Fetch Constitution Data
    async function fetchConstitution() {
        try {
            const response = await fetch('http://localhost:5000/constitution', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                }
            });
            if (!response.ok) throw new Error('Failed to fetch constitution');
            const data = await response.json();
            const list = document.getElementById('constitutionList');
            list.innerHTML = '';
            data.forEach(item => {
                const li = document.createElement('li');
                const titleSpan = document.createElement('span');
                titleSpan.textContent = `Article ${item.article_number}: ${item.title} (${item.chapter}${item.part ? ', ' + item.part : ''})`;
                titleSpan.style.cursor = 'pointer';
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'constitution-details';
                detailsDiv.style.display = 'none'; // Hidden by default
                detailsDiv.innerHTML = `
                    <p><strong>Text:</strong> ${item.text}</p>
                    <p><strong>Details:</strong> ${item.details || 'No additional details available.'}</p>
                `;
                li.appendChild(titleSpan);
                li.appendChild(detailsDiv);
                titleSpan.addEventListener('click', () => {
                    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
                });
                list.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching constitution:', error);
            document.getElementById('constitutionList').innerHTML = `<li>Error loading constitution: ${error.message}</li>`;
        }
    }

    // Contact Form Submission
document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const formDataObj = Object.fromEntries(formData);
    try {
        const response = await fetch('http://localhost:5000/contact', {
            method: 'POST',
            body: JSON.stringify(formDataObj),
            headers: { 
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send message');
        document.getElementById('contactResponse').style.display = 'block';
        document.getElementById('contactResponse').style.color = '#3b82f6';
        document.getElementById('contactResponse').textContent = 'Message sent successfully!';
        this.reset(); // Clear the form
    } catch (error) {
        document.getElementById('contactResponse').style.display = 'block';
        document.getElementById('contactResponse').style.color = '#ff4500';
        document.getElementById('contactResponse').textContent = `Error: ${error.message}`;
    }
});

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    });
});

// Fetch and Display User Profile
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) throw new Error('No token found in localStorage');
        const response = await fetch('http://localhost:5000/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('Profile data:', data);
        document.getElementById('profileUsername').textContent = data.name || 'N/A'; // Changed from username to name
        document.getElementById('profileEmail').textContent = data.email || 'N/A';
        document.getElementById('profileRole').textContent = data.role || 'N/A';
        document.getElementById('profileCreatedAt').textContent = data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A';
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profileResponse').style.display = 'block';
        document.getElementById('profileResponse').style.color = '#ff4500';
        document.getElementById('profileResponse').textContent = `Error: ${error.message}`;
    }
}

// Update Profile
document.getElementById('profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const updateData = Object.fromEntries(formData);
    if (!updateData.username && !updateData.password) { // Keep this as 'username' for form input name
        alert('Please enter a new name or password to update.');
        return;
    }
    try {
        const response = await fetch('http://localhost:5000/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData), // Backend expects 'username', we’ll map it
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update profile');
        document.getElementById('profileResponse').style.display = 'block';
        document.getElementById('profileResponse').style.color = '#3b82f6';
        document.getElementById('profileResponse').textContent = 'Profile updated successfully!';
        this.reset();
        loadProfile();
    } catch (error) {
        document.getElementById('profileResponse').style.display = 'block';
        document.getElementById('profileResponse').style.color = '#ff4500';
        document.getElementById('profileResponse').textContent = `Error: ${error.message}`;
    }
});

// Load profile when the section is viewed
document.querySelector('.sidebar li[data-tab="profile"]').addEventListener('click', () => {
    loadProfile();
});

    // Initial setup
    updateInterfaceForLoggedInUser();
});