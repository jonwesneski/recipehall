'use client'

import { mergeCss, type ClassValue } from '@repo/design-system'
import { useRecipeStepIngredientsStore } from '@src/providers/recipe-store-provider'
import { ingredientDisplayString } from '@src/utils/ingredientHelper'
import { withRetry } from '@src/utils/withRetry'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { IngredientRow, type IngredientRowHandle } from './ingredient'

// const placeholder = `0.5 cups fresh basil
// 1 1/4 cups peanuts
// 3 eggs
// 1 ounce salt`
// const placeholderSplit = placeholder.split('\n')

export interface IngredientsTextAreaHandle {
  focusLast: () => void
}
interface IngredientsTextAreaProps {
  stepId: string
  stepNumber: number
  className?: ClassValue
  onResize: (_height: number) => void
  onPaste: (_stepId: string, _ingredientId: string, _value: string[][]) => void
}
export const IngredientsTextArea = forwardRef<
  IngredientsTextAreaHandle,
  IngredientsTextAreaProps
>((props: IngredientsTextAreaProps, ref) => {
  const textAreaRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, IngredientRowHandle>>(new Map())
  useImperativeHandle(ref, () => ({
    focusLast: () => {
      withRetry(() => {
        const item = [...itemRefs.current.values()].at(-1)
        if (item) {
          item.focus()
          const length = item.getValue()?.length ?? 0
          item.setSelectionRange(length, length)
        }
        return item === undefined
      }, 8)
    },
  }))

  const { ingredients, ingredientIds, addIngredient, removeIngredient } =
    useRecipeStepIngredientsStore(props.stepId)

  const handleNewRow = (_ingredientId: string) => {
    addIngredient(props.stepId)
  }

  const handleRemove = (ingredientId: string) => {
    handleArrowUp(ingredientId)
    removeIngredient(props.stepId, ingredientId)
  }

  const handleArrowUp = (ingredientId: string) => {
    const index = ingredientIds.findIndex((id) => id === ingredientId)
    if (index > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it won't be null
      const row = itemRefs.current.get(ingredientIds[index - 1])!
      row.focus()
      const rangeValue = Math.min(
        row.getValue()?.length ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it won't be null
        itemRefs.current.get(ingredientId)!.getSelectionStart() ?? 0,
      )

      // This is not working for some reason; but should
      row.setSelectionRange(rangeValue, rangeValue)
    }
  }

  const handleArrowDown = (ingredientId: string) => {
    const index = ingredientIds.findIndex((id) => id === ingredientId)
    if (index < ingredientIds.length - 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it won't be null
      const row = itemRefs.current.get(ingredientIds[index + 1])!
      row.focus()
      const rangeValue = Math.min(
        row.getValue()?.length ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it won't be null
        itemRefs.current.get(ingredientId)!.getSelectionStart() ?? 0,
      )

      row.setSelectionRange(rangeValue, rangeValue)
    }
  }

  const handleFocus = () => {
    for (const item of itemRefs.current.values()) {
      if (document.activeElement === item.getElement()) {
        return
      }
    }
    const lastItem = [...itemRefs.current.values()].at(-1)
    lastItem?.focus()
  }

  /* When some pastes in recipes that are already separated by linebreaks
   * we will add new steps for them
   */
  const handleOnPaste = (ingredientId: string, value: string) => {
    const dataListofList = value.includes('\r')
      ? value.split('\r\n\r\n').map((v) => v.split('\r\n'))
      : value.split('\n\n').map((v) => v.split('\n'))
    props.onPaste(props.stepId, ingredientId, dataListofList)
  }

  return (
    <div
      ref={textAreaRef}
      data-testid="ingredients-text-area"
      className={mergeCss(
        'relative focus-within:bg-input-focus-background focus-within:[--bg-current:theme(colors.input-focus-background)] [--bg-current:theme(colors.background)] min-h-32 w-full border-2 pl-2 pr-2 pb-2 pt-4 cursor-text',
        props.className,
      )}
      role="textbox"
      onClick={handleFocus}
      tabIndex={0}
      onKeyDown={() => undefined}
    >
      {ingredientIds.map((id, i) => (
        <IngredientRow
          key={id}
          ingredientId={id}
          htmlFor={`step-${props.stepNumber}-ingredients`}
          label={i === 0 ? 'ingredients' : undefined}
          ref={(element) => {
            if (element) {
              itemRefs.current.set(id, element)
            } else {
              itemRefs.current.delete(id)
            }
          }}
          //placeholder={placeholderSplit[i]}
          value={ingredientDisplayString(ingredients[id])}
          error={
            ingredients[id].amount.errors?.[0] ??
            ingredients[id].name.errors?.[0]
          }
          // focusOnMount move this logic to step list component pass ref in callback?
          onPaste={handleOnPaste}
          onEnterPressed={handleNewRow}
          onRemove={handleRemove}
          onArrowDown={handleArrowDown}
          onArrowUp={handleArrowUp}
        />
      ))}
    </div>
  )
})
IngredientsTextArea.displayName = 'IngredientsTextArea'
