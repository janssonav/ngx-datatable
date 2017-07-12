import {
  Component, Input, ElementRef, Output, EventEmitter, Renderer,
  OnInit, OnDestroy, HostBinding, ViewChild
} from '@angular/core';

import { MouseEvent } from '../../events';

@Component({
  selector: 'datatable-scroller',
  template: `
    <div #frame class="datatable-scroll-frame"
         [style.position]="'absolute'"
         [style.float]="'left'"
         [style.overflow-x]="scrollbarV ? 'auto' : 'hidden'"
         [style.overflow-y]="'auto'"
         [style.height]="'100%'"
         [style.width]="'100%'"
         [style.background]="'transparent'"
         (scroll)="onScrolled($event)"
         (window:resize)="resize()">
      <div class="datatable-fake-scroll"
           [style.width.px]="scrollWidth"
           [style.height.px]="scrollHeight"
           [style.background]="'transparent'">
      </div>
    </div>
    <div class="datatable-scroll-viewport"
         [style.position]="'absolute'"
         [style.height]="scrollViewportHeight"
         [style.width]="scrollViewportWidth"
         [style.overflow]="'hidden'"
         (wheel)="onWheel($event)">
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
export class ScrollerComponent implements OnInit, OnDestroy {

  @Input() scrollbarV: boolean = false;
  @Input() scrollbarH: boolean = false;

  @Input() scrollHeight: number;
  @Input() scrollWidth: number;

  @Output() scroll: EventEmitter<any> = new EventEmitter();

  top: string;

  @ViewChild('frame') frameElement: ElementRef;

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
      this.parentElement = this.element.parentElement.parentElement;
      this.onScrollListener = this.renderer.listen(
        this.parentElement, 'scroll', this.onScrolled.bind(this));
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateViewport());
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
    this.scrollYPos = Math.max(0, this.scrollYPos + event.deltaY);
    this.scrollXPos = Math.max(0, this.scrollXPos + event.deltaX);
    this.updateOffset();
    event.preventDefault();
    event.stopPropagation();
  }

  resize() {
    this.updateViewport();
  }

  updateViewport() {
    this.scrollViewportWidth = this.frameElement.nativeElement.clientWidth + 'px';
    this.scrollViewportHeight = this.frameElement.nativeElement.clientHeight + 'px';
  }
}
