import {
  Component, Input, ElementRef, Output, EventEmitter, Renderer,
  OnInit, OnDestroy, OnChanges, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef
} from '@angular/core';

@Component({
  selector: 'datatable-scroller',
  template: `    
    <div #frame class="datatable-scroll-frame"
         (window:resize)="resize()">
      <div class="datatable-fake-scroll"
           [style.width.px]="scrollWidth"
           [style.height.px]="scrollHeight">
      </div>
    </div>
    <div #viewport class="datatable-scroll-viewport"
         [style.height.px]="scrollViewportHeight"
         [style.width.px]="scrollViewportWidth"
         [style.pointer-events]="pointerEvents">
      <div class="datatable-scroll"
           [style.height.px]="scrollHeight"
           [style.width.px]="scrollWidth"
           [style.margin-top.px]="top">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  host: {
    class: 'datatable-scroll'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollerComponent implements OnInit, OnChanges, OnDestroy {

  @Input() scrollbarV: boolean = false;
  @Input() scrollbarH: boolean = false;

  @Input() scrollHeight: number;
  @Input() scrollWidth: number;

  @Output() scroll: EventEmitter<any> = new EventEmitter();

  top: number;

  @ViewChild('frame') frameElement: ElementRef;
  @ViewChild('viewport') viewportElement: ElementRef;

  scrollYPos: number = 0;
  scrollXPos: number = 0;
  prevScrollYPos: number = 0;
  prevScrollXPos: number = 0;
  element: any;
  parentElement: any;
  onScrollListener: any;
  scrollViewportWidth: number;
  scrollViewportHeight: number;
  pointerEvents: string = 'auto';
  pointerCounter = 0;

  constructor(element: ElementRef, private renderer: Renderer, private cdr: ChangeDetectorRef) {
    this.element = element.nativeElement;
  }

  ngOnInit(): void {
    // manual bind so we don't always listen
    if(this.scrollbarV || this.scrollbarH) {
      const listeners = [
        this.renderer.listen(this.frameElement.nativeElement, 'scroll', this.onScrolled.bind(this)),
        this.renderer.listen(this.viewportElement.nativeElement, 'scroll', this.onViewportScrolled.bind(this)),
      ];
      if (this.scrollbarV) {
        listeners.push(this.renderer.listen(this.viewportElement.nativeElement, 'wheel', this.onWheel.bind(this)));
      }
      this.onScrollListener = () => listeners.forEach(l => l());
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateViewport());
  }

  ngOnChanges(): void {
    requestAnimationFrame(() => this.updateViewport());
  }

  ngOnDestroy(): void {
    if (this.scrollbarV || this.scrollbarH) {
      this.onScrollListener();
    }
  }

  setOffset(offsetY: number): void {
    if (this.parentElement) {
      this.parentElement.scrollTop = offsetY;
    }
  }

  onScrolled(event: MouseEvent): void {
    const dom: Element = <Element>event.currentTarget;
    this.scrollYPos = dom.scrollTop;
    this.scrollXPos = dom.scrollLeft;

    requestAnimationFrame(this.updateOffset.bind(this));
    this.resetPointerEvents();
  }

  // Only occurs if the viewport gets automatically scrolled due to e.g. focus changes
  onViewportScrolled(event: MouseEvent): void {
    const dom: Element = <Element>event.currentTarget;
    dom.scrollTop = 0;
    dom.scrollLeft = 0;
    // TODO: Call scrollTo with the appropriate args to sync the scroll position.
    // Currently, scrolling is prevented.
  }

  updateOffset(): void {
    let direction: string;
    if (this.scrollYPos < this.prevScrollYPos) {
      direction = 'down';
    } else if (this.scrollYPos > this.prevScrollYPos) {
      direction = 'up';
    }

    this.scroll.emit({
      direction,
      scrollYPos: this.scrollYPos,
      scrollXPos: this.scrollXPos
    });

    this.prevScrollYPos = this.scrollYPos;
    this.prevScrollXPos = this.scrollXPos;

    this.top = -this.scrollYPos;
  }

  onWheel(event: WheelEvent) {
    if (this.pointerEvents === 'auto') {
      this.frameElement.nativeElement.scrollTop += event.deltaY;
      this.frameElement.nativeElement.scrollLeft += event.deltaX;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  resetPointerEvents() {
    this.pointerEvents = 'none';
    this.pointerCounter++;
    const ctr = this.pointerCounter;
    setTimeout(() => this.restorePointerEvents(ctr), 500);
  }

  restorePointerEvents(counter) {
    if (this.pointerCounter === counter) {
      this.pointerEvents = 'auto';
      this.cdr.markForCheck();
    }
  }

  resize() {
    this.updateViewport();
  }

  private updateViewport() {
    if (this.scrollbarV || this.scrollbarH) {
      this.scrollViewportWidth = this.frameElement.nativeElement.clientWidth;
      this.scrollViewportHeight = this.frameElement.nativeElement.clientHeight;
      this.cdr.markForCheck();
    }
  }

  private scrollTo(top: number, left: number) {
    if (this.scrollbarV || this.scrollbarH) {
      const elem = this.frameElement.nativeElement;
      elem.scrollTop = top;
      elem.scrollLeft = left;
    }
  }
}
