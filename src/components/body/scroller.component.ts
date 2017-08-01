import {
  Component, Input, ElementRef, Output, EventEmitter, Renderer,
  OnInit, OnDestroy, ViewChild, OnChanges,
} from '@angular/core';

@Component({
  selector: 'datatable-scroller',
  template: `
    <div #frame class="datatable-scroll-frame"
         [style.position]="'absolute'"
         [style.float]="'left'"
         [style.overflow-x]="scrollbarV ? 'auto' : 'hidden'"
         [style.overflow-y]="scrollbarV ? 'auto' : 'hidden'"
         [style.height]="'100%'"
         [style.width]="'100%'"
         [style.background]="'transparent'"
         (window:resize)="resize()">
      <div class="datatable-fake-scroll"
           [style.width.px]="scrollWidth"
           [style.height.px]="scrollHeight"
           [style.background]="'transparent'">
      </div>
    </div>
    <div #viewport  class="datatable-scroll-viewport"
         [style.position]="'absolute'"
         [style.height]="scrollViewportHeight"
         [style.width]="scrollViewportWidth"
         [style.overflow]="'hidden'">
      <div class="datatable-scroll"
        [style.height.px]="scrollHeight"
        [style.width.px]="scrollWidth"
        [style.margin-top]="top">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  host: {
    class: 'datatable-scroll'
  }
})
export class ScrollerComponent implements OnInit, OnChanges, OnDestroy {

  @Input() scrollbarV: boolean = false;
  @Input() scrollbarH: boolean = false;

  @Input() scrollHeight: number;
  @Input() scrollWidth: number;

  @Output() scroll: EventEmitter<any> = new EventEmitter();

  top: string;

  @ViewChild('frame') frameElement: ElementRef;
  @ViewChild('viewport') viewportElement: ElementRef;

  scrollYPos: number = 0;
  scrollXPos: number = 0;
  prevScrollYPos: number = 0;
  prevScrollXPos: number = 0;
  element: any;
  parentElement: any;
  onScrollListener: any;
  scrollViewportWidth: string;
  scrollViewportHeight: string;

  constructor(element: ElementRef, private renderer: Renderer) {
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
    this.updateViewport();
  }

  ngOnDestroy(): void {
    if(this.scrollbarV || this.scrollbarH) {
      this.onScrollListener();
    }
  }

  setOffset(offsetY: number): void {
    if(this.parentElement) {
      this.parentElement.scrollTop = offsetY;
    }
  }

  onScrolled(event: MouseEvent): void {
    const dom: Element = <Element>event.currentTarget;
    this.scrollYPos = dom.scrollTop;
    this.scrollXPos = dom.scrollLeft;
    requestAnimationFrame(this.updateOffset.bind(this));
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
    if(this.scrollYPos < this.prevScrollYPos) {
      direction = 'down';
    } else if(this.scrollYPos > this.prevScrollYPos) {
      direction = 'up';
    }

    this.scroll.emit({
      direction,
      scrollYPos: this.scrollYPos,
      scrollXPos: this.scrollXPos
    });

    this.prevScrollYPos = this.scrollYPos;
    this.prevScrollXPos = this.scrollXPos;

    this.top = `${-this.scrollYPos}px`;
  }

  onWheel(event: WheelEvent) {
    const top = this.scrollYPos + event.deltaY;
    const left = this.scrollXPos + event.deltaX;
    event.preventDefault();
    event.stopPropagation();
    this.scrollTo(top, left);
  }

  resize() {
    this.updateViewport();
  }

  private updateViewport() {
    this.scrollViewportWidth = this.frameElement.nativeElement.clientWidth + 'px';
    this.scrollViewportHeight = this.frameElement.nativeElement.clientHeight + 'px';
  }

  private scrollTo(top: number, left: number) {
    const elem = this.frameElement.nativeElement;
    elem.scrollTop = top;
    elem.scrollLeft = left;
  }
}
