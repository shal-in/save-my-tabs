let activeCollections = []; // Initialize activeCollections

// Collections
const collectionsPageEl = document.getElementById("collections-page");
const collectionsAddBtnEl = collectionsPageEl.querySelector("#collections-header-add");
const collectionsListEl = document.getElementById("collections-list");

const tabsPageEl = document.getElementById("tabs-page");
collectionsAddBtnEl.addEventListener("click", () => {
    prepareTabsPage();
    displayPage(tabsPageEl, collectionsPageEl);
});

let storedActiveCollections;

function getActiveCollections() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["activeCollections"], function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.activeCollections || []); // Resolve with empty array if not found
            }
        });
    });
}

async function retrieveActiveCollections() {
    try {
        storedActiveCollections = await getActiveCollections();
        console.log('Retrieved active Collections:', storedActiveCollections);

        // Update activeCollections with retrieved data
        activeCollections = storedActiveCollections;

        // Call prepareCollectionsPage after data is retrieved
        prepareCollectionsPage();
    } catch (error) {
        console.error('Error retrieving active Collections:', error);
    }
}

function prepareCollectionsPage() {
    collectionsListEl.innerHTML = "";

    // Iterate over activeCollections to create list items
    activeCollections.forEach((collection, index) => {
        createCollectionsListItem(collection, index);
    });
}

function createCollectionsListItem(collection, i) {
    let name = collection.name;
    let tabs = collection.tabs;
    let dateCreated = collection.dateCreated;

    const parentDiv = document.createElement("div");
    parentDiv.classList.add("collections-item");
    parentDiv.id = `collections-item-${i}`;

    const collectionCheckbox = document.createElement("input");
    collectionCheckbox.type = "checkbox";
    collectionCheckbox.classList.add("collections-checkbox");
    collectionCheckbox.id = `collections-checkbox-${i}`;

    const collectionText = document.createElement("h2");
    collectionText.classList.add("collections-item-text");
    collectionText.id = `collections-item-text-${i}`;
    collectionText.textContent = name;

    parentDiv.append(collectionCheckbox);
    parentDiv.appendChild(collectionText);

    collectionsListEl.appendChild(parentDiv);
}

// Initial retrieval and preparation
retrieveActiveCollections();




// Tabs
const tabsBackBtnEl = document.getElementById("tabs-header-back");
tabsBackBtnEl.addEventListener("click", () => {
    displayPage(collectionsPageEl, tabsPageEl)
})

const tabsCheckboxEl = document.getElementById("tabs-header-checkbox");
tabsCheckboxEl.addEventListener("change", () => {
    tabsHeaderCheckboxFunction();
})

function tabsHeaderCheckboxFunction() {
    const tabsItemEls = document.querySelectorAll(".tabs-item");

    let isChecked = tabsCheckboxEl.checked
    tabsItemEls.forEach(element => {
        let checkboxEl = element.querySelector(".tabs-checkbox");
        checkboxEl.checked = isChecked;
    })

    getSelectedTabs();
    updateTabsSelectCount();
}

function tabsCheckboxFunction() {
    getSelectedTabs();
    updateTabsSelectCount();
}

let selectedTabs;
function getSelectedTabs() {
    selectedTabs = [];

    const tabsItemEls = document.querySelectorAll(".tabs-item");
    tabsItemEls.forEach(element => {
        let checkboxEl = element.querySelector(".tabs-checkbox");
        
        if (checkboxEl.checked) {
            let tabData = {
                "title": element.getAttribute("title"),
                "url": element.getAttribute("url")
            }

            selectedTabs.push(tabData);
        }
    })
}

function updateTabsSelectCount() {
    const tabsSelectedEl = document.getElementById("tabs-selected-count");

    tabsSelectedEl.textContent = selectedTabs.length;
}

async function prepareTabsPage() {
    tabsCheckboxEl.checked = false;
    tabsHeaderCheckboxFunction();

    newCollectionNameInputEl.value = "New collection";

    tabsListEl.innerHTML = "";
    const openTabs = await getOpenTabs();

    openTabs.forEach((tab, i) => {
        createTabsListItem(tab.title, tab.url, i);
    });
}

async function getOpenTabs() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({}, function(tabs) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const tabInfo = tabs.map(tab => ({ title: tab.title, url: tab.url }));
            resolve(tabInfo);
        });
    });
}

const tabsListEl = document.getElementById("tabs-list");
function createTabsListItem(title, url, i) {
    const tabsItemDiv = document.createElement("div");
    tabsItemDiv.classList.add("tabs-item");
    tabsItemDiv.id = `tabs-item-${i}`;
    tabsItemDiv.setAttribute("title", title);
    tabsItemDiv.setAttribute("url", url);

    const tabsCheckbox = document.createElement("input");
    tabsCheckbox.type = "checkbox";
    tabsCheckbox.classList.add("tabs-checkbox");
    tabsCheckbox.id = `tabs-checkbox-${i}`;
    tabsCheckbox.addEventListener("change", () => {
        tabsCheckboxFunction();
    })

    const tabsText = document.createElement("h2");
    tabsText.classList.add("tabs-item-text");
    tabsText.id = `tabs-text-${i}`;
    tabsText.textContent = title;

    tabsItemDiv.appendChild(tabsCheckbox);
    tabsItemDiv.appendChild(tabsText);

    tabsListEl.appendChild(tabsItemDiv);
}

const newCollectionNameInputEl = document.getElementById("tabs-name-input");
newCollectionNameInputEl.value = getCollectionName();

const createNewCollectionBtnEl = document.getElementById("tabs-add-button");
createNewCollectionBtnEl.addEventListener("click", async () => {
    let name = newCollectionNameInputEl.value.trim();
    let collectionData = {
        "name": getCollectionName(name),
        "tabs": selectedTabs,
        "dateCreated": getTodaysDate()
    }

    activeCollections.push(collectionData);

    try {
        let success = await storeActiveCollections();
        if (success) {
            prepareCollectionsPage();
            displayPage(collectionsPageEl, tabsPageEl);
        }
    } catch (error) {
        console.error("Failed to store active collections:", error);
    }
});




function getCollectionName(name = "New collection") {
    if (!name) {
        name = "New collection"
    }
    
    let baseName = name;
    let i = 1;

    while (checkCollectionNameTaken(name)) {
        name = `${baseName} (${i})`;
        i += 1;
    }

    return name;
}

function checkCollectionNameTaken(name) {
    let nameTaken = false;
    activeCollections.forEach(collection => {
        if (collection.name === name) {
            nameTaken = true;
        }
    });
    return nameTaken;
}




function storeActiveCollections() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ "activeCollections": activeCollections }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error saving the collection:", chrome.runtime.lastError);
                reject(false);
            } else {
                console.log("Active collections saved:", activeCollections);
                resolve(true);
            }
        });
    });
}


function displayPage(displayEl, hideEl) {
    hideEl.classList.remove("page-active");

    displayEl.classList.add("page-active");
}

function getTodaysDate() {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

    return `${day}/${month}/${year}`;
}