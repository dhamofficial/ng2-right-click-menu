import {
  AfterContentInit,
  AfterViewInit,
  Component, ContentChildren, ElementRef, Input, OnDestroy, QueryList, TemplateRef, ViewChild, ViewChildren, ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import {ShContextMenuItemDirective} from './sh-context-menu-item.directive';
import {ShContextMenuService} from './sh-context-menu.service';
import {OverlayRef} from '@angular/cdk/overlay';

@Component({
  selector: 'sh-context-menu',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['sh-context-menu.css'],
  template: `
    <ng-container #componentContainer></ng-container>
    <ng-template #componentTemplate>
      <div class="sh-context-menu">
        <div
          *ngFor="let item of menuItems"
          #itemElement
          [ngClass]="{'sh-sub-anchor': item.subMenu, 'sh-context-menu--item__divider': item.divider}"
          class="sh-context-menu--item"
          (mouseenter)="onEnter($event, item, itemElement)"
          (click)="onClick($event, item)">
          <ng-container *ngIf="!item.divider">
            <ng-content
              #itemContl
              *ngTemplateOutlet="item.template; context: item.context">
            </ng-content>
          </ng-container>
        </div>
      </div>
    </ng-template>
  `
})
export class ShContextMenuComponent implements OnDestroy {
  @Input() thisContext: any;
  @ContentChildren(ShContextMenuItemDirective, {read: ShContextMenuItemDirective}) contentChildrenItems;
  @ViewChildren(ShContextMenuItemDirective, {read: ShContextMenuItemDirective}) viewChildrenItems;

  @ViewChild('componentTemplate', {read: TemplateRef}) cmpTemplate;
  @ViewChild('componentContainer', {read: ViewContainerRef}) cmpContainer;

  overlayRef: OverlayRef;
  isSub = false;

  constructor(private ctxService: ShContextMenuService) {
    this.contentChildrenItems = new QueryList<ShContextMenuItemDirective>();
    this.viewChildrenItems = new QueryList<ShContextMenuItemDirective>();
  }

  get menuItems(): QueryList<ShContextMenuItemDirective> {
    // when using the ShContextMenuComponent as menu, the ContentChildren is the source
    if (this.contentChildrenItems.length) {
      return this.contentChildrenItems;
    }

    // when using a custom component as menu the ViewChildren is the source
    return this.viewChildrenItems;
  }

  onEnter($event: MouseEvent, item: ShContextMenuItemDirective, elm: HTMLElement) {
    // TODO: close all child submenus
    this.ctxService.closeSubMenus(this);

    if (!item.subMenu) {
      return;
    }

    this.ctxService.openSubMenu({
      hostMenu: this,
      data: item.context.$implicit,
      targetElement: new ElementRef(elm),
      menu: item.subMenu,
      mouseEvent: $event
    });
  }

  onLeave($event: MouseEvent, item: ShContextMenuItemDirective, elm: HTMLElement) {

  }

  onClick($event: MouseEvent, item: ShContextMenuItemDirective) {
    // TODO: move click handling to service

    if (item.divider) {
      return;
    }

    if (item.on) {
      this.ctxService.destroy();
      this.callWithContext(item.on, item, item.context.$implicit);
    }
  }

  private callWithContext(fn, fallbackContext, ...args) {
    fn.call(this.thisContext ? this.thisContext : fallbackContext, ...args);
  }

  ngOnDestroy(): void {
    this.cmpContainer.detach();
    this.overlayRef.detach();
  }
}
