import React, { useState, useEffect, useRef } from 'react';
import { Card, Renderable } from './datatypes';
import { awaitDelay } from '../common/await_functions';

interface DashboardElementLayoutProps {
  id: string
  renderable: Renderable<Card>
  registerRenderRenderable?: (renderRenderable: (renderable: Renderable<Card>) => Promise<void>) => void
  onFocus?: (card: Card) => void
  onMouseOver?: (card: Card) => void
  onMouseOut?: (card: Card) => void
}

export const DashboardElementLayout: React.FC<DashboardElementLayoutProps> = ({
  id,
  renderable,
  registerRenderRenderable,
  onFocus,
  onMouseOver,
  onMouseOut,
}) => {
  const ContainerRef = useRef(null)
  const [rendered, setRendered] = useState<Renderable<Card>>(null)

  useEffect(() => {
    renderRenderable(renderable)
  }, [])

  const renderRenderable = async (renderable: Renderable<Card>) => {
    await awaitDelay(500)
    if (ContainerRef.current) {
      if (ContainerRef.current.firstChild) {
        ContainerRef.current.removeChild(ContainerRef.current.firstChild)
      }
      ContainerRef.current.appendChild(renderable.getRenderable(renderable.card));
      if (onFocus) onFocus(renderable.card)
    }
    setRendered(renderable)
  }
  if (registerRenderRenderable) registerRenderRenderable(renderRenderable)
  return (
    <div
      id={id}
      ref={ContainerRef}
      onMouseOver={() => {
        if (onMouseOver && rendered) {
          onMouseOver(rendered.card)
        }
      }}
      onMouseOut={() => {
        if (onMouseOut && rendered) {
          onMouseOut(rendered.card)
        }
      }}
      onFocus={() => {
        if (onFocus && rendered) {
          onFocus(rendered.card)
        }
      }}
      onClick={(e) => {
        if (e.currentTarget.firstElementChild) {
          if (rendered && rendered.onClick) {
            rendered.onClick(rendered.card)
          }
        }
      }}
    ></div>
  )
}