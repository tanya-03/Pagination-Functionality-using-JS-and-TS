// Item interface: id and name are required, value is optional
interface Item {
  id: number;
  name: string;
  value?: string | number;
}

// Cached DOM elements for the paginator
interface PaginatorElements {
  listEl: HTMLElement | null;
  firstBtn: HTMLButtonElement | null;
  prevBtn: HTMLButtonElement | null;
  pageButtonsEl: HTMLElement | null;
  nextBtn: HTMLButtonElement | null;
  lastBtn: HTMLButtonElement | null;
  pageSizeSelect: HTMLSelectElement | null;
  jumpInput: HTMLInputElement | null;
  jumpBtn: HTMLButtonElement | null;
  jumpErrorEl: HTMLElement | null;
  pageInfoEl: HTMLElement | null;
  pageNumbersEl: HTMLElement | null;
  pageSizeLabel: HTMLElement | null;
  jumpLabel: HTMLElement | null;
  dividerEl: HTMLElement | null;
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded Successfully!");

  fetch("data.json")
    .then((res: Response) => {
      console.log("Fetch response received:", res);
      if (!res.ok) throw new Error("Network response not ok"); // Detect HTTP errors
      return res.json();
    })
    .then((jsonData: Item[]) => {
      const items: Item[] = jsonData;

      initPager(items);
    })
    .catch((err) => {
      // handles errors if JSON fails to load
      console.error(
        "Failed to load data.json. Pagination not initialized.",
        err
      );
    });

  // Initialize paginator with given data and attach all control event handlers
  function initPager(dataArray: Item[]) {
    const paginator = new Paginator(dataArray, 10);
    attachControlHandlers(paginator);
  }

  class Paginator {
    private data: Item[];
    private pageSize: number;
    private currentPage: number;
    private elements: PaginatorElements;

    constructor(data: Item[] = [], pageSize: number | string = 10) {
      this.data = Array.isArray(data) ? data.slice() : [];
      this.pageSize = Math.max(1, parseInt(String(pageSize), 10) || 10);
      this.currentPage = 1;

      this.elements = {
        listEl: document.getElementById("list"),
        firstBtn: document.getElementById(
          "firstBtn"
        ) as HTMLButtonElement | null,
        prevBtn: document.getElementById("prevBtn") as HTMLButtonElement | null,
        pageNumbersEl: document.getElementById("pageNumbers"),
        nextBtn: document.getElementById("nextBtn") as HTMLButtonElement | null,
        lastBtn: document.getElementById("lastBtn") as HTMLButtonElement | null,
        pageSizeSelect: document.getElementById(
          "pageSizeSelect"
        ) as HTMLSelectElement | null,
        jumpInput: document.getElementById(
          "jumpInput"
        ) as HTMLInputElement | null,
        jumpBtn: document.getElementById("jumpBtn") as HTMLButtonElement | null,
        jumpErrorEl: document.getElementById("jumpError"),
        pageInfoEl: document.getElementById("pageInfo"),
        pageSizeLabel: document.getElementById("pageSizeLabel"),
        jumpLabel: document.getElementById("jumpLabel"),
        pageButtonsEl: document.getElementById("pageButtons"),
        dividerEl: document.querySelector(".divider") as HTMLElement | null,
      };

      this.render();
    }

    get totalItems(): number {
      return this.data.length;
    }

    get totalPages(): number {
      return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    }

    private clampPage(page: number | string): number {
      //ensure valid page numbers
      const p = Math.min(Math.max(1, Number(page) || 1), this.totalPages); //input > totalpages then go to last page
      return p;
    }

    goToPage(page: number | string): void {
      const floored = Math.floor(Number(page));
      const clamped = this.clampPage(floored);

      if (floored < 1 || floored > this.totalPages) {
        this.showJumpError(`Page must be (1 - ${this.totalPages})`);
      } else {
        this.showJumpError("");
      }

      this.currentPage = clamped;
      this.render();
    }

    next(): void {
      this.goToPage(this.currentPage + 1);
    }

    prev(): void {
      this.goToPage(this.currentPage - 1);
    }

    first(): void {
      this.goToPage(1);
    }

    last(): void {
      this.goToPage(this.totalPages);
    }

    setPageSize(newSize: number | string): void {
      const size = Math.max(1, parseInt(String(newSize), 10) || 1);
      if (size === this.pageSize) return;

      const oldFirstIndex = (this.currentPage - 1) * this.pageSize;
      this.pageSize = size;
      this.currentPage = this.clampPage(
        Math.floor(oldFirstIndex / this.pageSize) + 1
      );
      this.render();
    }

    showJumpError(msg: string | null): void {
      if (!this.elements.jumpErrorEl) return;
      this.elements.jumpErrorEl.textContent = msg || "";
      if (msg) {
        setTimeout(() => {
          if (this.elements.jumpErrorEl?.textContent === msg) {
            this.elements.jumpErrorEl.textContent = "";
          }
        }, 3000);
      }
    }

    renderList(): void {
      const list = this.elements.listEl;
      if (!list) return;

      if (this.totalItems === 0) {
        list.innerHTML = '<div style="color:red;">No items available</div>';
        return;
      }

      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(this.totalItems, start + this.pageSize); // uses min that may be last page not contains the multiple of pagesize
      let html = "";
      for (let i = start; i < end; i++) {
        const item = this.data[i];
        html += `<div class="item">${item.id}. ${item.name} , ${
          item.value ?? "N/A"
        }</div>`;
      }

      list.innerHTML = html;
    }

    // Render page number buttons with ellipses
    private renderPageButtons(): void {
      const container = this.elements.pageButtonsEl;
      if (!container) return;

      container.innerHTML = ""; // Clear existing buttons

      const total = this.totalPages;
      const current = this.currentPage;
      const maxDisplay = 5; // always show 5 buttons when total > 5

      // Case 1: no items or single page
      if (total <= 1) {
        if (total === 1) container.appendChild(this.createPageButton(1, true));
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
        if (start < 1) start = 1;
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
          container.appendChild(
            this.createPageButton(total, current === total)
          );
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
    private createPageButton(pageNum: number, isCurrent = false): HTMLElement {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-btn";
      btn.textContent = String(pageNum);

      if (isCurrent) {
        btn.classList.add("current");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          this.goToPage(pageNum);
        });
      }

      return btn;
    }

    renderControls(): void {
      const noItems = this.totalItems === 0;

      if (noItems) {
        this.elements.pageNumbersEl?.style.setProperty("display", "none");
        this.elements.pageInfoEl?.style.setProperty("display", "none");
        this.elements.firstBtn && (this.elements.firstBtn.disabled = true);
        this.elements.prevBtn && (this.elements.prevBtn.disabled = true);
        this.elements.nextBtn && (this.elements.nextBtn.disabled = true);
        this.elements.lastBtn && (this.elements.lastBtn.disabled = true);
        this.elements.pageSizeSelect?.style.setProperty("display", "none");
        this.elements.jumpInput?.style.setProperty("display", "none");
        this.elements.jumpBtn?.style.setProperty("display", "none");
        this.elements.jumpErrorEl?.style.setProperty("display", "none");
        this.elements.pageSizeLabel?.style.setProperty("display", "none");
        this.elements.jumpLabel?.style.setProperty("display", "none");
        this.elements.pageButtonsEl?.style.setProperty("display", "none");
        this.elements.dividerEl?.style.setProperty("display", "none");
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
      const isLast =
        this.currentPage === this.totalPages || this.totalItems === 0;
      if (this.elements.firstBtn) this.elements.firstBtn.disabled = isFirst;
      if (this.elements.prevBtn) this.elements.prevBtn.disabled = isFirst;
      if (this.elements.nextBtn) this.elements.nextBtn.disabled = isLast;
      if (this.elements.lastBtn) this.elements.lastBtn.disabled = isLast;
      this.elements.pageButtonsEl?.style.setProperty("display", "");
      this.elements.dividerEl?.style.setProperty("display", "");
    }

    render(): void {
      this.renderList();
      this.renderControls();
    }
  }

  // Attaches event listeners to pagination controls to handle user interactions.
  function attachControlHandlers(paginator: Paginator): void {
    const firstBtn = document.getElementById(
      "firstBtn"
    ) as HTMLButtonElement | null;
    const prevBtn = document.getElementById(
      "prevBtn"
    ) as HTMLButtonElement | null;
    const nextBtn = document.getElementById(
      "nextBtn"
    ) as HTMLButtonElement | null;
    const lastBtn = document.getElementById(
      "lastBtn"
    ) as HTMLButtonElement | null;
    const pageSizeSelect = document.getElementById(
      "pageSizeSelect"
    ) as HTMLSelectElement | null;
    const jumpBtn = document.getElementById(
      "jumpBtn"
    ) as HTMLButtonElement | null;
    const jumpInput = document.getElementById(
      "jumpInput"
    ) as HTMLInputElement | null;

    // Attach event handlers to pagination buttons
    if (firstBtn) firstBtn.addEventListener("click", () => paginator.first());
    if (prevBtn) prevBtn.addEventListener("click", () => paginator.prev());
    if (nextBtn) nextBtn.addEventListener("click", () => paginator.next());
    if (lastBtn) lastBtn.addEventListener("click", () => paginator.last());

    // Handle page size change
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const newSize = parseInt(target.value, 10);
        if (newSize > 0) paginator.setPageSize(newSize);
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
      jumpInput.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") handleJump();
      });
    }
  }
});
