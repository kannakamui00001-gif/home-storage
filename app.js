
/* =========================
   INVENTORY SYSTEM
========================= */

// 1. โหลดข้อมูลจาก localStorage
const STORAGE_KEY = "homeStorageItemsV1";

function loadItems() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
        return [];
    }

    try {
        const data = JSON.parse(saved);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("โหลดข้อมูลไม่สำเร็จ", error);
        return [];
    }
}

let items = loadItems();


// 2. เลือก HTML Elements
const itemTableBody = document.getElementById("itemTableBody");
const searchItem = document.getElementById("searchItem");
const emptyMessage = document.getElementById("emptyMessage");

const totalItems = document.getElementById("totalItems");
const availableItems = document.getElementById("availableItems");
const unknownItems = document.getElementById("unknownItems");

const addItemBtn = document.getElementById("addItemBtn");
const itemDialog = document.getElementById("itemDialog");
const itemForm = document.getElementById("itemForm");

const closeItemDialog = document.getElementById("closeItemDialog");
const cancelItemBtn = document.getElementById("cancelItemBtn");

const itemName = document.getElementById("itemName");
const itemCategory = document.getElementById("itemCategory");
const itemType = document.getElementById("itemType");
const itemQuantity = document.getElementById("itemQuantity");
const itemStatus = document.getElementById("itemStatus");
const itemFormTitle = document.querySelector(".form-heading h2");
const itemSubmitBtn = itemForm.querySelector('button[type="submit"]');

const itemLocationsContainer =
    document.getElementById("itemLocationsContainer");

const addItemLocationBtn =
    document.getElementById("addItemLocationBtn");

function getLocationPath(location) {
    const names = [location.name];
    let parentId = location.parentId;

    while (parentId) {
        const parent = locations.find(
            item => item.id === parentId
        );

        if (!parent) break;

        names.unshift(parent.name);
        parentId = parent.parentId;
    }

    return names.join(" > ");
}

function addItemLocationRow(locationId = "", quantity = 1) {
    const row = document.createElement("div");
    row.className = "item-location-row";

    const select = document.createElement("select");
    select.className = "item-location-select";
    select.required = true;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "เลือกตำแหน่งจัดเก็บ";
    select.appendChild(placeholder);

    locations
        .filter(location => location.type !== "house")
        .forEach(location => {
            const option = document.createElement("option");
            option.value = location.id;
            option.textContent = getLocationPath(location);
            select.appendChild(option);
        });

    select.value = locationId;

    const amount = document.createElement("input");
    amount.type = "number";
    amount.className = "item-location-quantity";
    amount.min = "1";
    amount.max = "999999";
    amount.step = "1";
    amount.value = quantity;
    amount.required = true;
    amount.setAttribute("aria-label", "จำนวนในตำแหน่งนี้");

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-delete";
    removeBtn.textContent = "ลบ";
    removeBtn.addEventListener("click", function () {
        row.remove();
    });

    row.append(select, amount, removeBtn);
    itemLocationsContainer.appendChild(row);
}

addItemLocationBtn.addEventListener("click", function () {
    addItemLocationRow();
});


// null หมายถึงกำลังเพิ่มสิ่งของใหม่
let editingItemId = null;

// 3. บันทึกข้อมูล
function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}


// 4. แสดงรายการสิ่งของ


function renderItems(data) {
    itemTableBody.replaceChildren();
    emptyMessage.hidden = data.length > 0;

    data.forEach(function (item) {
        const row = document.createElement("tr");

        const statusText = item.status === "available"
            ? "พร้อมใช้งาน"
            : "ไม่ทราบตำแหน่ง";

        const statusClass = item.status === "available"
            ? "status-available"
            : "status-unknown";

        // ข้อมูลพื้นฐานของสิ่งของ
        [item.id, item.name, item.category, item.quantity]
            .forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

        
        // ตำแหน่งจัดเก็บ
        const locationTd = document.createElement("td");
        const savedLocations = item.storageLocations || [];

        if (savedLocations.length === 0) {
            locationTd.textContent =
                item.status === "unknown"
                    ? "ไม่ทราบตำแหน่ง"
                    : "ยังไม่ได้ระบุตำแหน่ง";
        } else {
            savedLocations.forEach(function (entry) {
                const location = locations.find(function (loc) {
                    return loc.id === entry.locationId;
                });

                const locationLine = document.createElement("div");
                locationLine.className = "item-location-info";

                // แสดงเฉพาะชื่อปลายทาง
                const locationName = document.createElement("div");
                locationName.textContent = location
                    ? location.name
                    : "ไม่พบตำแหน่งจัดเก็บนี้";

                locationLine.appendChild(locationName);

                // สร้างข้อความเส้นทางเต็ม โดยซ่อนไว้ก่อน
                const pathText = document.createElement("div");
                pathText.className = "item-location-path";
                pathText.textContent = location
                    ? getLocationPath(location)
                    : "ไม่พบตำแหน่งจัดเก็บนี้";
                pathText.hidden = true;

                // ปุ่มเปิดและซ่อนเส้นทาง
                if (location) {
                    const pathBtn = document.createElement("button");
                    pathBtn.type = "button";
                    pathBtn.className = "btn-secondary";
                    pathBtn.textContent = "ดูเส้นทาง";

                    pathBtn.addEventListener("click", function () {
                        pathText.hidden = !pathText.hidden;
                        pathBtn.textContent = pathText.hidden
                            ? "ดูเส้นทาง"
                            : "ซ่อนเส้นทาง";
                    });

                    locationLine.appendChild(pathBtn);
                }

                const quantityText = document.createElement("small");
                quantityText.textContent =
                    "จำนวน " + entry.quantity + " ชิ้น";

                locationLine.append(pathText, quantityText);
                locationTd.appendChild(locationLine);
            });
        }

        row.appendChild(locationTd);


        // สถานะ
        const statusTd = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = "item-status " + statusClass;
        badge.textContent = statusText;

        statusTd.appendChild(badge);
        row.appendChild(statusTd);

        // ช่องจัดการ
        const actionsTd = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "item-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn-edit";
        editBtn.textContent = "แก้ไข";

        editBtn.addEventListener("click", function () {
            editItem(item.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = "ลบ";

        deleteBtn.addEventListener("click", function () {
            deleteItem(item.id);
        });

        actions.append(editBtn, deleteBtn);
        actionsTd.appendChild(actions);
        row.appendChild(actionsTd);

        itemTableBody.appendChild(row);
    });
}




// 5. อัปเดตตัวเลขสรุป
function updateInventorySummary() {
    totalItems.textContent = items.length;

    availableItems.textContent = items.filter(
        item => item.status === "available"
    ).length;

    unknownItems.textContent = items.filter(
        item => item.status === "unknown"
    ).length;
}


// 6. ค้นหาสิ่งของ
function refreshInventory() {
    const keyword = searchItem.value.trim().toLowerCase();

    const filtered = items.filter(function (item) {
        return (
            item.name.toLowerCase().includes(keyword) ||
            item.id.toLowerCase().includes(keyword) ||
            item.category.toLowerCase().includes(keyword)
        );
    });

    renderItems(filtered);
    updateInventorySummary();
}

searchItem.addEventListener("input", refreshInventory);


// 7. เปิดฟอร์มเพิ่มสิ่งของ
addItemBtn.addEventListener("click", function () {
    editingItemId = null;

    itemForm.reset();
    itemFormTitle.textContent = "เพิ่มสิ่งของใหม่";
    itemSubmitBtn.textContent = "บันทึกสิ่งของ";

    itemDialog.showModal();
    itemName.focus();
});


// 8. ปิดฟอร์ม
function closeForm() {
    itemDialog.close();
}

closeItemDialog.addEventListener("click", closeForm);
cancelItemBtn.addEventListener("click", closeForm);


// 9. เพิ่มสิ่งของใหม่

itemForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = itemName.value.trim();
    const category = itemCategory.value.trim();
    const quantity = Number(itemQuantity.value);

    if (
        !name ||
        !category ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 999999
    ) {
        alert("กรุณากรอกข้อมูลให้ถูกต้อง");
        return;
    }

    if (itemType.value === "individual" && quantity !== 1) {
        alert("สิ่งของแบบแยกชิ้น เพิ่มได้ครั้งละ 1 ชิ้น");
        return;
    }
    
const locationRows = [
    ...itemLocationsContainer.querySelectorAll(".item-location-row")
];

const storageLocations = [];
const usedLocationIds = new Set();

for (const row of locationRows) {
    const locationId =
        row.querySelector(".item-location-select").value;

    const locationQuantity = Number(
        row.querySelector(".item-location-quantity").value
    );

    if (!locationId) {
        alert("กรุณาเลือกตำแหน่งจัดเก็บให้ครบ");
        return;
    }

    if (usedLocationIds.has(locationId)) {
        alert("ห้ามเลือกตำแหน่งเดิมซ้ำ");
        return;
    }

    if (
        !Number.isSafeInteger(locationQuantity) ||
        locationQuantity < 1 ||
        locationQuantity > 999999
    ) {
        alert("กรุณากรอกจำนวนในแต่ละตำแหน่งให้ถูกต้อง");
        return;
    }

    usedLocationIds.add(locationId);

    storageLocations.push({
        locationId: locationId,
        quantity: locationQuantity
    });
}

const storedQuantity = storageLocations.reduce(
    (total, entry) => total + entry.quantity,
    0
);

if (storageLocations.length > 0 && storedQuantity !== quantity) {
    alert("จำนวนในตำแหน่งต่าง ๆ ต้องรวมกันเท่ากับจำนวนสิ่งของทั้งหมด");
    return;
}

if (itemStatus.value === "available" && storageLocations.length === 0) {
    alert("กรุณาเลือกตำแหน่งจัดเก็บ หรือเปลี่ยนสถานะเป็นไม่ทราบตำแหน่ง");
    return;
}

    let nextItems;

    if (editingItemId === null) {
        // เพิ่มรายการใหม่
        
    const newItem = {
        id: "IT-" + crypto.randomUUID(),
        name: name,
        category: category,
        type: itemType.value,
        quantity: quantity,
        status: itemStatus.value,
        storageLocations: storageLocations,
        createdBy: memberSelect.value,
        createdAt: new Date().toISOString()
    };


        nextItems = [...items, newItem];

    } else {
        // แก้ไขรายการเดิม
        const existingItem = items.find(
            item => item.id === editingItemId
        );

        if (!existingItem) {
            alert("ไม่พบสิ่งของที่ต้องการแก้ไข");
            return;
        }

        nextItems = items.map(function (item) {
            if (item.id !== editingItemId) {
                return item;
            }

            return {
                ...item,
                name: name,
                category: category,
                type: itemType.value,
                quantity: quantity,
                status: itemStatus.value,
                storageLocations: storageLocations,
                updatedBy: memberSelect.value,
                updatedAt: new Date().toISOString()
            };
        });
    }

    // บันทึกลง localStorage
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextItems)
        );
    } catch (error) {
        console.error(error);
        alert("บันทึกข้อมูลไม่สำเร็จ");
        return;
    }

    items = nextItems;

    refreshInventory();
    itemDialog.close();
    editingItemId = null;
});


// ลบสิ่งของ
function deleteItem(id) {
    const item = items.find(function (item) {
        return item.id === id;
    });

    if (!item) {
        return;
    }

    const confirmed = confirm(
        `ต้องการลบ "${item.name}" ใช่หรือไม่?\nการลบนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) {
        return;
    }

    const nextItems = items.filter(function (item) {
        return item.id !== id;
    });

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextItems)
        );
    } catch (error) {
        console.error(error);
        alert("ลบข้อมูลไม่สำเร็จ");
        return;
    }

    items = nextItems;
    refreshInventory();
}


/* =========================
   แก้ไขข้อมูลสิ่งของ
========================= */


function editItem(id) {
    const item = items.find(function (item) {
        return item.id === id;
    });

    if (!item) {
        alert("ไม่พบสิ่งของที่ต้องการแก้ไข");
        return;
    }

    editingItemId = id;

    itemName.value = item.name;
    itemCategory.value = item.category;
    itemType.value = item.type || "quantity";
    itemQuantity.value = item.quantity;
    itemStatus.value = item.status;

    // ล้างตำแหน่งที่แสดงอยู่ก่อน
    itemLocationsContainer.replaceChildren();

    // โหลดตำแหน่งเดิมของสิ่งของ
    const savedLocations = item.storageLocations || [];

    savedLocations.forEach(function (entry) {
        addItemLocationRow(
            entry.locationId,
            entry.quantity
        );
    });

    itemFormTitle.textContent = "แก้ไขสิ่งของ";
    itemSubmitBtn.textContent = "บันทึกการแก้ไข";

    itemDialog.showModal();
    itemName.focus();
}



// 10. เริ่มต้นแสดงรายการ



    
/* =========================
   LOCATION SYSTEM
========================= */

const LOCATION_KEY = "homeStorageLocationsV1";

const addLocationBtn = document.getElementById("addLocationBtn");
const locationDialog = document.getElementById("locationDialog");
const locationForm = document.getElementById("locationForm");
const locationName = document.getElementById("locationName");
const locationType = document.getElementById("locationType");
const locationParent = document.getElementById("locationParent");
const locationsGrid = document.getElementById("locationsGrid");

const closeLocationDialog =
    document.getElementById("closeLocationDialog");

const cancelLocationBtn =
    document.getElementById("cancelLocationBtn");


function editLocation(id) {
    const location = locations.find(function (item) {
        return item.id === id;
    });

    if (!location) {
        alert("ไม่พบตำแหน่งที่ต้องการแก้ไข");
        return;
    }

    editingLocationId = id;

    locationForm.reset();
    updateLocationParents();

    locationName.value = location.name;
    locationType.value = location.type;
    updateLocationParents();

    locationParent.value = location.parentId || "";

    locationFormTitle.textContent = "แก้ไขตำแหน่ง";
    locationSubmitBtn.textContent = "บันทึกการแก้ไข";

    locationDialog.showModal();
    locationName.focus();
}



async function deleteLocation(id) {
    const location = locations.find(function (item) {
        return item.id === id;
    });

    if (!location) {
        alert("ไม่พบตำแหน่งที่ต้องการลบ");
        return;
    }

    // ตรวจสอบว่ามีตำแหน่งลูกหรือไม่
    const hasChildren = locations.some(function (item) {
        return item.parentId === id;
    });

    if (hasChildren) {
        alert(
            "ไม่สามารถลบตำแหน่งนี้ได้\n" +
            "กรุณาจัดการตำแหน่งที่อยู่ภายในก่อน"
        );
        return;
    }

    const confirmed = confirm(
        `ต้องการลบตำแหน่ง "${location.name}" ใช่หรือไม่?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `api/locations.php?id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "ลบตำแหน่งไม่สำเร็จ");
            return;
        }

        // อัปเดตข้อมูลใน JavaScript หลังจาก API ลบสำเร็จ
        locations = locations.filter(function (item) {
            return item.id !== id;
        });

        renderLocations();

        alert("ลบตำแหน่งสำเร็จ");

    } catch (error) {
        console.error(error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
}


    
// โหลดข้อมูลเก่าจาก localStorage
function loadLocations() {
    try {
        const saved = localStorage.getItem(LOCATION_KEY);
        const data = saved ? JSON.parse(saved) : [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("โหลดตำแหน่งไม่สำเร็จ", error);
        return [];
    }
}

let locations = [];
let editingLocationId = null;
async function loadLocationsFromAPI() {
    try {
        const response = await fetch(
            "api/locations.php"
        );

        if (!response.ok) {
            throw new Error("โหลดตำแหน่งไม่สำเร็จ");
        }

        locations = await response.json();

    } catch (error) {
        console.error(error);
        alert("ไม่สามารถโหลดตำแหน่งจากฐานข้อมูลได้");
    }
}
const locationFormTitle =
    locationForm.querySelector(".form-heading h2");

const locationSubmitBtn =
    locationForm.querySelector('button[type="submit"]');

// แสดงตำแหน่งทั้งหมด


function renderLocations() {
    locationsGrid.replaceChildren();

    if (locations.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "ยังไม่มีตำแหน่งจัดเก็บ";
        locationsGrid.appendChild(message);
        return;
    }

    const typeNames = {
        house: "บ้าน",
        room: "ห้อง",
        cabinet: "ตู้",
        shelf: "ชั้น",
        box: "กล่อง"
    };

    const typeIcons = {
        house: "🏠",
        room: "🚪",
        cabinet: "🗄️",
        shelf: "📚",
        box: "📦"
    };

    // สร้างการ์ดตำแหน่งและตำแหน่งลูก
    function createLocationNode(location) {
        const branch = document.createElement("div");
        branch.className = "location-tree-branch";

        const card = document.createElement("div");
        card.className = "location-card";

        const info = document.createElement("div");
        info.className = "location-info";

        const title = document.createElement("h3");
        title.textContent =
            (typeIcons[location.type] || "📍") + " " + location.name;

        const type = document.createElement("p");
        type.textContent =
            "ประเภท: " + (typeNames[location.type] || "อื่น ๆ");

        info.append(title, type);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn-edit";
        editBtn.textContent = "แก้ไข";
        editBtn.addEventListener("click", function () {
            editLocation(location.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = "ลบ";
        deleteBtn.addEventListener("click", function () {
            deleteLocation(location.id);
        });

        actions.append(editBtn, deleteBtn);
        card.append(info, actions);
        branch.appendChild(card);

        // ค้นหาตำแหน่งลูกของตำแหน่งนี้
        const children = locations.filter(function (item) {
            return item.parentId === location.id;
        });

        if (children.length > 0) {
            const childContainer = document.createElement("div");
            childContainer.className = "location-tree-children";

            children.forEach(function (child) {
                childContainer.appendChild(createLocationNode(child));
            });

            branch.appendChild(childContainer);
        }

        return branch;
    }

    // แสดงบ้านเป็นระดับบนสุด
    const houses = locations.filter(function (location) {
        return location.type === "house";
    });

    houses.forEach(function (house) {
        locationsGrid.appendChild(createLocationNode(house));
    });

    // แสดงตำแหน่งเก่าที่ไม่มีบ้านหรือตำแหน่งแม่
    // เพื่อไม่ให้ข้อมูลเดิมหายไปจากหน้าจอ
    const orphanLocations = locations.filter(function (location) {
        return location.type !== "house" &&
            (!location.parentId ||
            !locations.some(function (item) {
                return item.id === location.parentId;
            }));
    });

    if (orphanLocations.length > 0) {
        const oldTitle = document.createElement("h3");
        oldTitle.textContent = "ตำแหน่งที่ยังไม่ได้จัดเข้าบ้าน";
        locationsGrid.appendChild(oldTitle);

        orphanLocations.forEach(function (location) {
            locationsGrid.appendChild(createLocationNode(location));
        });
    }
}




function updateLocationParents() {
    locationParent.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = locationType.value === "house"
        ? "ไม่มี (บ้านระดับบนสุด)"
        : "เลือกตำแหน่งแม่";
    locationParent.appendChild(defaultOption);

    const typeNames = {
        house: "บ้าน",
        room: "ห้อง",
        cabinet: "ตู้",
        shelf: "ชั้น",
        box: "กล่อง"
    };

    const parentTypes = {
        house: [],
        room: ["house"],
        cabinet: ["room"],
        shelf: ["cabinet"],
        box: ["shelf"]
    };

    const allowedTypes = parentTypes[locationType.value] || [];

    locations
        .filter(function (location) {
            return allowedTypes.includes(location.type);
        })
        .forEach(function (location) {
            const option = document.createElement("option");
            option.value = location.id;
            option.textContent =
                location.name + " (" + typeNames[location.type] + ")";

            locationParent.appendChild(option);
        });
}


// เปิดฟอร์ม
addLocationBtn.addEventListener("click", function () {
    editingLocationId = null;

    locationForm.reset();
    updateLocationParents();

    locationFormTitle.textContent = "เพิ่มตำแหน่งใหม่";
    locationSubmitBtn.textContent = "บันทึกตำแหน่ง";

    locationDialog.showModal();
    locationName.focus();
});

locationType.addEventListener("change", updateLocationParents);

// ปิดฟอร์ม
closeLocationDialog.addEventListener("click", function () {
    locationDialog.close();
});

cancelLocationBtn.addEventListener("click", function () {
    locationDialog.close();
});

// บันทึกตำแหน่ง

locationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = locationName.value.trim();
    const type = locationType.value;
    const parentId = locationParent.value || null;

    if (!name) {
        alert("กรุณากรอกชื่อตำแหน่ง");
        return;
    }

    
const allowedParents = {
    house: [],
    room: ["house"],
    cabinet: ["room"],
    shelf: ["cabinet"],
    box: ["shelf"]
};

const parent = locations.find(function (location) {
    return location.id === parentId;
});

if (type === "house") {
    if (parentId) {
        alert("บ้านต้องเป็นตำแหน่งระดับบนสุด");
        return;
    }
} else {
    if (!parentId) {
        alert("กรุณาเลือกตำแหน่งแม่");
        return;
    }

    if (
        !parent ||
        !allowedParents[type] ||
        !allowedParents[type].includes(parent.type)
    ) {
        alert("ตำแหน่งแม่ไม่ถูกต้อง");
        return;
    }
}


    // ตรวจสอบชื่อซ้ำ โดยไม่นับรายการที่กำลังแก้ไข
    const duplicate = locations.some(function (item) {
        return (
            item.id !== editingLocationId &&
            item.name.trim().toLowerCase() === name.toLowerCase() &&
            item.type === type &&
            (item.parentId || null) === parentId
        );
    });

    if (duplicate) {
        alert("มีตำแหน่งชื่อนี้อยู่แล้วในตำแหน่งแม่เดียวกัน");
        return;
    }

    if (editingLocationId === null) {
    // เพิ่มตำแหน่งใหม่ผ่าน API
    try {
        const response = await fetch("api/locations.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                type: type,
                parentId: parentId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "เพิ่มตำแหน่งไม่สำเร็จ");
            return;
        }

        // รับข้อมูลตำแหน่งที่ MySQL สร้างให้
        locations.push(result.location);

        renderLocations();
        locationDialog.close();
        editingLocationId = null;

        return;

    } catch (error) {
        console.error(error);
        alert("ไม่สามารถเชื่อมต่อ API ได้");
        return;
    }

} else {
    // แก้ไขตำแหน่งเดิมผ่าน API
    const existing = locations.find(
        item => item.id === editingLocationId
    );

    if (!existing) {
        alert("ไม่พบตำแหน่งที่ต้องการแก้ไข");
        return;
    }

    try {
        const response = await fetch("api/locations.php", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: editingLocationId,
                name: name,
                type: type,
                parentId: parentId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "แก้ไขตำแหน่งไม่สำเร็จ");
            return;
        }

        // อัปเดตข้อมูลในหน้าเว็บ
        locations = locations.map(function (item) {
            if (item.id !== editingLocationId) {
                return item;
            }

            return {
                ...item,
                name: name,
                type: type,
                parentId: parentId
            };
        });

        renderLocations();
        locationDialog.close();
        editingLocationId = null;

        return;

    } catch (error) {
        console.error(error);
        alert("ไม่สามารถเชื่อมต่อ API ได้");
        return;
    }
}

});


// แสดงข้อมูลเมื่อเปิดเว็บ
async function initApp() {
    await loadLocationsFromAPI();

    renderLocations();
    refreshInventory();
}

initApp();


