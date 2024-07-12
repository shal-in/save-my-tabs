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
        console.log("Retrieved active Collections:", storedActiveCollections);

        // Update activeCollections with retrieved data
        activeCollections = storedActiveCollections;

        // Call prepareCollectionsPage after data is retrieved
        prepareCollectionsPage();
    } catch (error) {
        console.error("Error retrieving active Collections:", error);
    }
}

function prepareCollectionsPage() {
    collectionsListEl.innerHTML = "";
    collectionsDict = {};

    // Iterate over activeCollections to create list items
    activeCollections.forEach((collection, index) => {
        createCollectionsListItem(collection, index);
    });
}

let collectionsDict = {};
function createCollectionsListItem(collection, i) {
    let name = collection.name;
    let tabs = collection.tabs;
    let dateCreated = collection.dateCreated;

    const collectionsItemDiv = document.createElement("div");
    collectionsItemDiv.classList.add("collections-item");
    collectionsItemDiv.id = `collections-item-${i}`;
    collectionsItemDiv.setAttribute("title", name);

    const collectionCheckbox = document.createElement("input");
    collectionCheckbox.type = "checkbox";
    collectionCheckbox.classList.add("collections-checkbox");
    collectionCheckbox.id = `collections-checkbox-${i}`;
    collectionCheckbox.addEventListener("change", () => {
        collectionsCheckboxFunction();

        if (!collectionCheckbox.checked) {
            collectionsCheckboxEl.checked = false;
        }
    })

    const collectionText = document.createElement("h2");
    collectionText.classList.add("collections-item-text");
    collectionText.id = `collections-item-text-${i}`;
    collectionText.textContent = name;

    // Get the button container
    const collectionButtonContainer = document.createElement("div");
    collectionButtonContainer.classList.add("collections-button-container")
    collectionButtonContainer.id = `collections-button-container-${i}`;

    const openSVGElement = createSVGElement(getCollectionSVGs("open", i));
    const deleteSVGElement = createSVGElement(getCollectionSVGs("delete", i));

    openSVGElement.addEventListener("click", () => {
        openTabsBtnFunction(collection);
    })

    deleteSVGElement.addEventListener("click", () => {
        deleteCollectionBtnFunction(collection, collectionsItemDiv);

        collectionCheckbox.checked = false;
        collectionsCheckboxFunction();
    })

    collectionButtonContainer.appendChild(openSVGElement);
    collectionButtonContainer.appendChild(deleteSVGElement);

    collectionsItemDiv.append(collectionCheckbox);
    collectionsItemDiv.appendChild(collectionText);
    collectionsItemDiv.appendChild(collectionButtonContainer);

    collectionsListEl.appendChild(collectionsItemDiv);

    collectionsDict[name] = {"div": collectionsItemDiv, "collection": collection}
}


// Initial retrieval and preparation
retrieveActiveCollections();

function openTabsBtnFunction(collection) {
    const tabs = collection.tabs;

    tabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url })
    })
}

function deleteCollectionBtnFunction(collection, div) {
    deleteCollection(collection, div);
}

function deleteCollection(collection, div) {
        // Remove collection from activeCollections
        activeCollections = activeCollections.filter(col => col !== collection);

        // Remove div from screen
        div.remove();
    
        // Update storage after removing the collection
        storeActiveCollections()
            .then(() => {
                console.log("Collection deleted and storage updated successfully.");
            })
            .catch(error => {
                console.error("Error updating storage after deleting collection:", error);
            });
}

const collectionsCheckboxEl = document.getElementById("collections-header-checkbox");
collectionsCheckboxEl.addEventListener("change", () => {
    collectionsHeaderCheckboxFunction();
})

function collectionsHeaderCheckboxFunction() {
    const collectionsItems = document.querySelectorAll(".collections-item");

    let isChecked = collectionsCheckboxEl.checked;
    collectionsItems.forEach(element => {
        let checkboxEl = element.querySelector(".collections-checkbox");
        checkboxEl.checked = isChecked
    })

    getSelectedCollections();
    updateCollectionsSelectedCount();
}

function collectionsCheckboxFunction() {
    getSelectedCollections();
    updateCollectionsSelectedCount();
}

let selectedCollections;
function getSelectedCollections() {
    selectedCollections = []

    const collectionsItems = document.querySelectorAll(".collections-item");
    collectionsItems.forEach(element => {
        let checkboxEl = element.querySelector(".collections-checkbox");

        if (checkboxEl.checked) {
            let title = element.getAttribute("title");

            selectedCollections.push(title);

            element.style.backgroundColor = "#bababa"
        } else {
            element.style.backgroundColor = "lightgray"
        }
    })
}

function updateCollectionsSelectedCount() {
    const collectionsSelectedEl = document.getElementById("collections-selected-count");

    collectionsSelectedEl.textContent = selectedCollections.length;

    if (selectedCollections.length === 0) {
        addBtn
    }
}

const collectionsDeleteAllBtnEl = document.getElementById("collections-delete-button");
collectionsDeleteAllBtnEl.addEventListener("click", () => {
    selectedCollections.forEach(title => {
        let div = collectionsDict[title].div;
        let collection = collectionsDict[title].collection;

        deleteCollection(collection, div);
    })

    collectionsCheckboxEl.checked = false;

    getSelectedCollections();
    updateCollectionsSelectedCount();
})

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
            
            element.style.backgroundColor = "#bababa"
        } else {
            element.style.backgroundColor = "lightgray"
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

    newCollectionNameInputEl.value = getCollectionName();

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
    getSelectedTabs();

    if (selectedTabs.length === 0) {
        return;
    }

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

function createSVGElement(svgString) {
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(svgString, "image/svg+xml");
    return svgDocument.documentElement;
}

function getCollectionSVGs(icon, i) {
    let text = `class="collections-item-${icon}" id="collections-item-${icon}-${i}"`;

    if (icon === "open") {
        return `<svg ${text} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M22 14v8h-12v-8h12zm2-6h-16v16h16v-16zm-2-2h-16v16h1v-15h15v-1zm-2-2h-16v16h1v-15h15v-1zm-2-2h-16v16h1v-15h15v-1z"/></svg>`;
    }
    
    if (icon === "delete") {
        return `<svg ${text} clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="m4.015 5.494h-.253c-.413 0-.747-.335-.747-.747s.334-.747.747-.747h5.253v-1c0-.535.474-1 1-1h4c.526 0 1 .465 1 1v1h5.254c.412 0 
            .746.335.746.747s-.334.747-.746.747h-.254v15.435c0 .591-.448 1.071-1 1.071-2.873 0-11.127 0-14 0-.552 0-1-.48-1-1.071zm14.5 0h-13v15.006h13zm-4.25 2.506c-.414 
            0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm-4.5 0c-.414 0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm3.75-4v-.5h-3v.5z" 
            fill-rule="nonzero"/></svg>`;
    }
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

    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

    return `${day}/${month}/${year}`;
}

