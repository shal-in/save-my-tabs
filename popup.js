const exampleEl = document.getElementById("example");

function print(text) {
    exampleEl.appendChild(document.createTextNode(text + "  "))
}

// Collections
const collectionsPageEl = document.getElementById("collections-page");
const collectionsAddBtnEl = collectionsPageEl.querySelector("#collections-header-add");

collectionsAddBtnEl.addEventListener("click", () => {
    displayPage(tabsPageEl, collectionsPageEl);

    prepareTabsPage();
})



// Tabs
const tabsPageEl = document.getElementById("tabs-page");
const tabsHeaderCheckboxEl = document.getElementById("tabs-header-checkbox");
const tabsBackBtnEl = document.getElementById("tabs-header-back");

tabsHeaderCheckboxEl.addEventListener("change", () => {
    const isChecked = tabsHeaderCheckboxEl.checked;

    const tabsItemsCheckboxEls = document.querySelectorAll(".tabs-checkbox");
    tabsItemsCheckboxEls.forEach(element => {
        element.checked = isChecked;
    });
});


tabsBackBtnEl.addEventListener("click", () => {
    displayPage(collectionsPageEl, tabsPageEl);
})

function createTabsItem(title, url, i) {
    let parentDiv = document.createElement("div");
    parentDiv.classList.add("tabs-item");
    parentDiv.id = `tabs-item-${i}`;

    let checkboxEl = document.createElement("input");
    checkboxEl.type = "checkbox";
    checkboxEl.classList.add("tabs-checkbox");
    checkboxEl.id = `tabs-checkbox-${i}`;

    let titleEl = document.createElement("h2");
    titleEl.classList.add("tabs-item-text");
    titleEl.id = `tabs-text-${i}`;
    titleEl.textContent = title;

    parentDiv.appendChild(checkboxEl);
    parentDiv.appendChild(titleEl);

    tabsPageEl.appendChild(parentDiv);
}

async function prepareTabsPage() {
    tabsHeaderCheckboxEl.checked = false;
    const tabsItems = document.querySelectorAll(".tabs-item");

    tabsItems.forEach(element => {
        element.remove();
    });

    try {
        const tabsArray = await getOpenTabs();

        let i = 0;
        for (let tab of tabsArray) {
            let url = tab.url;
            let title = tab.title;

            createTabsItem(title, url, i);
            i += 1;
        }
    } catch (error) {
        console.error('Error fetching tabs:', error);
    }
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



function displayPage(displayEl, hideEl) {
    hideEl.classList.remove("page-active");

    displayEl.classList.add("page-active");
}