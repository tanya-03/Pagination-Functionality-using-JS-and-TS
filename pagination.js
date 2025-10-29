window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded Successfully!");
    fetch("data.json")
        .then((res) => {
        console.log("Fetch response received:", res);
        if (!res.ok)
            throw new Error("Network response not ok"); // Detect HTTP errors
        return res.json();
    })
        .then((jsonData) => {
        const items = (jsonData === null || jsonData === void 0 ? void 0 : jsonData.map((item, idx) => {
            var _a, _b;
            return ({
                // typecasting jsonData to Item[] or undefined
                id: (_a = item === null || item === void 0 ? void 0 : item.id) !== null && _a !== void 0 ? _a : idx + 1, // default id if missing
                name: (_b = item === null || item === void 0 ? void 0 : item.name) !== null && _b !== void 0 ? _b : `Item ${idx + 1}`, // default name if missing
                value: item === null || item === void 0 ? void 0 : item.value,
            });
        })) || [];
        initPager(items);
    })
        .catch((err) => {
        // handles errors if JSON fails to load
        console.error("Failed to load data.json. Pagination not initialized.", err);
    });
    // Initialize paginator with given data and attach all control event handlers
    function initPager(dataArray) {
        const paginator = new Paginator(dataArray, 10);
        attachControlHandlers(paginator);
    }
    class Paginator {
        constructor(data = [], pageSize = 10) {
            this.data = Array.isArray(data) ? data.slice() : [];
            this.pageSize = Math.max(1, parseInt(String(pageSize), 10) || 10);
            this.currentPage = 1;
            this.elements = {
                listEl: document.getElementById("list"),
                firstBtn: document.getElementById("firstBtn"),
                prevBtn: document.getElementById("prevBtn"),
                pageNumbersEl: document.getElementById("pageNumbers"),
                nextBtn: document.getElementById("nextBtn"),
                lastBtn: document.getElementById("lastBtn"),
                pageSizeSelect: document.getElementById("pageSizeSelect"),
                jumpInput: document.getElementById("jumpInput"),
                jumpBtn: document.getElementById("jumpBtn"),
                jumpErrorEl: document.getElementById("jumpError"),
                pageInfoEl: document.getElementById("pageInfo"),
                pageSizeLabel: document.getElementById("pageSizeLabel"),
                jumpLabel: document.getElementById("jumpLabel"),
                pageButtonsEl: document.getElementById("pageButtons"),
                dividerEl: document.querySelector(".divider"),
            };
            this.render();
        }
        get totalItems() {
            return this.data.length;
        }
        get totalPages() {
            return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
        }
        clampPage(page) {
            //ensure valid page numbers
            const p = Math.min(Math.max(1, Number(page) || 1), this.totalPages); //input > totalpages then go to last page
            return p;
        }
        goToPage(page) {
            const floored = Math.floor(Number(page));
            const clamped = this.clampPage(floored);
            if (floored < 1 || floored > this.totalPages) {
                this.showJumpError(`Page must be (1 - ${this.totalPages})`);
            }
            else {
                this.showJumpError("");
            }
            this.currentPage = clamped;
            this.render();
        }
        next() {
            this.goToPage(this.currentPage + 1);
        }
        prev() {
            this.goToPage(this.currentPage - 1);
        }
        first() {
            this.goToPage(1);
        }
        last() {
            this.goToPage(this.totalPages);
        }
        setPageSize(newSize) {
            const size = Math.max(1, parseInt(String(newSize), 10) || 1);
            if (size === this.pageSize)
                return;
            const oldFirstIndex = (this.currentPage - 1) * this.pageSize;
            this.pageSize = size;
            this.currentPage = this.clampPage(Math.floor(oldFirstIndex / this.pageSize) + 1);
            this.render();
        }
        showJumpError(msg) {
            if (!this.elements.jumpErrorEl)
                return;
            this.elements.jumpErrorEl.textContent = msg || "";
            if (msg) {
                setTimeout(() => {
                    var _a;
                    if (((_a = this.elements.jumpErrorEl) === null || _a === void 0 ? void 0 : _a.textContent) === msg) {
                        this.elements.jumpErrorEl.textContent = "";
                    }
                }, 3000);
            }
        }
        renderList() {
            var _a;
            const list = this.elements.listEl;
            if (!list)
                return;
            if (this.totalItems === 0) {
                list.innerHTML = '<div style="color:red;">No items available</div>';
                return;
            }
            const start = (this.currentPage - 1) * this.pageSize;
            const end = Math.min(this.totalItems, start + this.pageSize); // uses min that may be last page not contains the multiple of pagesize
            let html = "";
            for (let i = start; i < end; i++) {
                const item = this.data[i];
                html += `<div class="item">${item.id}. ${item.name} , ${(_a = item.value) !== null && _a !== void 0 ? _a : "N/A"}</div>`;
            }
            list.innerHTML = html;
        }
        // Render page number buttons with ellipses
        renderPageButtons() {
            const container = this.elements.pageButtonsEl;
            if (!container)
                return;
            container.innerHTML = ""; // Clear existing buttons
            const total = this.totalPages;
            const current = this.currentPage;
            const maxDisplay = 5; // always show 5 buttons when total > 5
            // Case 1: no items or single page
            if (total <= 1) {
                if (total === 1)
                    container.appendChild(this.createPageButton(1, true));
                return;
            }
            // Case 2: total page is less or equal then maxDisplay
            if (total <= maxDisplay) {
                for (let p = 1; p <= total; p++) {
                    container.appendChild(this.createPageButton(p, p === current));
                }
                return;
            }
            // Compute sliding window of length maxDisplay, center on current when possible
            const half = Math.floor(maxDisplay / 2);
            let start = current - half;
            let end = start + maxDisplay - 1;
            // Normalize window if it goes out of bounds
            if (start < 1) {
                start = 1;
                end = start + maxDisplay - 1;
            }
            if (end > total) {
                end = total;
                start = end - maxDisplay + 1;
                if (start < 1)
                    start = 1;
            }
            // Window touches the left edge (start <= 2), render the leftmost window (no leading ellipsis)
            if (start <= 2) {
                start = 1;
                end = Math.min(total, start + maxDisplay - 1);
                for (let p = start; p <= end; p++) {
                    container.appendChild(this.createPageButton(p, p === current));
                }
                // Show trailing ellipsis + last only if the window doesn't already include last
                if (end < total) {
                    if (end < total - 1) {
                        const ell = document.createElement("span");
                        ell.className = "ellipsis";
                        ell.textContent = "…";
                        container.appendChild(ell);
                    }
                    container.appendChild(this.createPageButton(total, current === total));
                }
                return;
            }
            // Window touches the right edge (end >= total - 1), render the rightmost window (no trailing ellipsis)
            if (end >= total - 1) {
                end = total;
                start = Math.max(1, end - maxDisplay + 1);
                // If window doesn't include the first page, show first + possible ellipsis
                if (start > 1) {
                    container.appendChild(this.createPageButton(1, current === 1));
                    if (start > 2) {
                        const ell = document.createElement("span");
                        ell.className = "ellipsis";
                        ell.textContent = "…";
                        container.appendChild(ell);
                    }
                }
                for (let p = start; p <= end; p++) {
                    container.appendChild(this.createPageButton(p, p === current));
                }
                return;
            }
            // Middle window: show first + left-ellipsis, window, right-ellipsis + last
            // Add first page + left ellipsis
            container.appendChild(this.createPageButton(1, current === 1));
            if (start > 2) {
                const ellLeft = document.createElement("span");
                ellLeft.className = "ellipsis";
                ellLeft.textContent = "…";
                container.appendChild(ellLeft);
            }
            // main centered window
            for (let p = start; p <= end; p++) {
                container.appendChild(this.createPageButton(p, p === current));
            }
            // right ellipsis + last page
            if (end < total - 1) {
                const ellRight = document.createElement("span");
                ellRight.className = "ellipsis";
                ellRight.textContent = "…";
                container.appendChild(ellRight);
            }
            container.appendChild(this.createPageButton(total, current === total));
        }
        // Page button element
        createPageButton(pageNum, isCurrent = false) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "page-btn";
            btn.textContent = String(pageNum);
            if (isCurrent) {
                btn.classList.add("current");
                btn.disabled = true;
            }
            else {
                btn.addEventListener("click", () => {
                    this.goToPage(pageNum);
                });
            }
            return btn;
        }
        renderControls() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const noItems = this.totalItems === 0;
            if (noItems) {
                (_a = this.elements.pageNumbersEl) === null || _a === void 0 ? void 0 : _a.style.setProperty("display", "none");
                (_b = this.elements.pageInfoEl) === null || _b === void 0 ? void 0 : _b.style.setProperty("display", "none");
                this.elements.firstBtn && (this.elements.firstBtn.disabled = true);
                this.elements.prevBtn && (this.elements.prevBtn.disabled = true);
                this.elements.nextBtn && (this.elements.nextBtn.disabled = true);
                this.elements.lastBtn && (this.elements.lastBtn.disabled = true);
                (_c = this.elements.pageSizeSelect) === null || _c === void 0 ? void 0 : _c.style.setProperty("display", "none");
                (_d = this.elements.jumpInput) === null || _d === void 0 ? void 0 : _d.style.setProperty("display", "none");
                (_e = this.elements.jumpBtn) === null || _e === void 0 ? void 0 : _e.style.setProperty("display", "none");
                (_f = this.elements.jumpErrorEl) === null || _f === void 0 ? void 0 : _f.style.setProperty("display", "none");
                (_g = this.elements.pageSizeLabel) === null || _g === void 0 ? void 0 : _g.style.setProperty("display", "none");
                (_h = this.elements.jumpLabel) === null || _h === void 0 ? void 0 : _h.style.setProperty("display", "none");
                (_j = this.elements.pageButtonsEl) === null || _j === void 0 ? void 0 : _j.style.setProperty("display", "none");
                (_k = this.elements.dividerEl) === null || _k === void 0 ? void 0 : _k.style.setProperty("display", "none");
                return;
            }
            this.renderPageButtons();
            if (this.elements.pageNumbersEl && this.elements.pageInfoEl) {
                const start = (this.currentPage - 1) * this.pageSize + 1;
                const end = Math.min(this.totalItems, this.currentPage * this.pageSize);
                this.elements.pageNumbersEl.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
                this.elements.pageInfoEl.textContent = `Showing items ${start} - ${end} of ${this.totalItems}`;
            }
            const isFirst = this.currentPage === 1;
            const isLast = this.currentPage === this.totalPages || this.totalItems === 0;
            if (this.elements.firstBtn)
                this.elements.firstBtn.disabled = isFirst;
            if (this.elements.prevBtn)
                this.elements.prevBtn.disabled = isFirst;
            if (this.elements.nextBtn)
                this.elements.nextBtn.disabled = isLast;
            if (this.elements.lastBtn)
                this.elements.lastBtn.disabled = isLast;
            (_l = this.elements.pageButtonsEl) === null || _l === void 0 ? void 0 : _l.style.setProperty("display", "");
            (_m = this.elements.dividerEl) === null || _m === void 0 ? void 0 : _m.style.setProperty("display", "");
        }
        render() {
            this.renderList();
            this.renderControls();
        }
    }
    // Attaches event listeners to pagination controls to handle user interactions.
    function attachControlHandlers(paginator) {
        const firstBtn = document.getElementById("firstBtn");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const lastBtn = document.getElementById("lastBtn");
        const pageSizeSelect = document.getElementById("pageSizeSelect");
        const jumpBtn = document.getElementById("jumpBtn");
        const jumpInput = document.getElementById("jumpInput");
        // Attach event handlers to pagination buttons
        if (firstBtn)
            firstBtn.addEventListener("click", () => paginator.first());
        if (prevBtn)
            prevBtn.addEventListener("click", () => paginator.prev());
        if (nextBtn)
            nextBtn.addEventListener("click", () => paginator.next());
        if (lastBtn)
            lastBtn.addEventListener("click", () => paginator.last());
        // Handle page size change
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener("change", (e) => {
                const target = e.target;
                const newSize = parseInt(target.value, 10);
                if (newSize > 0)
                    paginator.setPageSize(newSize);
            });
        }
        // Handle jump-to-page functionality
        if (jumpBtn && jumpInput) {
            const handleJump = () => {
                const val = jumpInput.value.trim();
                if (!val) {
                    paginator.showJumpError("Enter page Number");
                    return;
                }
                const page = parseInt(val, 10);
                paginator.goToPage(page);
                jumpInput.value = "";
            };
            jumpBtn.addEventListener("click", handleJump);
            jumpInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter")
                    handleJump();
            });
        }
    }
});
