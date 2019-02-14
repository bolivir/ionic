import React from 'react';
import ReactDOM from 'react-dom';
import { OverlayEventDetail } from '@ionic/core';
import { attachEventProps } from './utils'
import { ensureElementInBody, dashToPascalCase } from './utils';
import { OverlayComponentElement, OverlayControllerComponentElement } from '../types';

export function createOverlayComponent<T extends object, E extends OverlayComponentElement, C extends OverlayControllerComponentElement<E>>(tagName: string, controllerTagName: string) {
  const displayName = dashToPascalCase(tagName);
  const dismissEventName = `onIon${displayName}DidDismiss`;

  type ReactProps = {
    children: React.ReactNode;
    isOpen: boolean;
    onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => void;
  }
  type Props = T & ReactProps;

  return class ReactControllerComponent extends React.Component<Props> {
    element: E;
    controllerElement: C;
    el: HTMLDivElement;

    constructor(props: Props) {
      super(props);

      this.el = document.createElement('div');
    }

    static get displayName() {
      return displayName;
    }

    componentDidMount() {
      this.controllerElement = ensureElementInBody<C>(controllerTagName);
    }

    async componentDidUpdate(prevProps: Props) {
      if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen === true) {
        const { children, isOpen, onDidDismiss, ...cProps} = this.props;

        await this.controllerElement.componentOnReady();
        this.element = await this.controllerElement.create({
          ...cProps,
          [dismissEventName]: onDidDismiss,
          component: this.el,
          componentProps: {}
        });
        await this.element.present();

        attachEventProps(this.element, cProps);
      }
      if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen === false) {
        await this.element.dismiss();
      }
    }

    render() {
      return ReactDOM.createPortal(
        this.props.children,
        this.el,
      );
    }
  }
}

