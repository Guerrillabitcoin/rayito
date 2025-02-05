import React, { useState } from 'react'
import { Dropdown, FormControl } from 'react-bootstrap'
import TocIcon from '../svgs/list-unordered.svg'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import GithubSlugger from 'github-slugger'

export default function Toc ({ text }) {
  if (!text || text.length === 0) {
    return null
  }

  const tree = fromMarkdown(text)
  const toc = []
  const slugger = new GithubSlugger()
  visit(tree, 'heading', (node, position, parent) => {
    const str = toString(node)
    toc.push({ heading: str, slug: slugger.slug(str.replace(/[^\w\-\s]+/gi, '')), depth: node.depth })
  })

  if (toc.length === 0) {
    return null
  }

  return (
    <Dropdown alignRight className='d-flex align-items-center'>
      <Dropdown.Toggle as={CustomToggle} id='dropdown-custom-components'>
        <TocIcon className='mx-2 fill-grey theme' />
      </Dropdown.Toggle>

      <Dropdown.Menu as={CustomMenu}>
        {toc.map(v => {
          return (
            <Dropdown.Item
              className={v.depth === 1 ? 'font-weight-bold' : ''}
              style={{
                marginLeft: `${(v.depth - 1) * 5}px`
              }}
              key={v.slug} href={`#${v.slug}`}
            >{v.heading}
            </Dropdown.Item>
          )
        })}
      </Dropdown.Menu>
    </Dropdown>
  )
}

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=''
    ref={ref}
    onClick={(e) => {
      e.preventDefault()
      onClick(e)
    }}
  >
    {children}
  </a>
))

// forwardRef again here!
// Dropdown needs access to the DOM of the Menu to measure it
const CustomMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('')

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          className='mx-3 my-2 w-auto'
          placeholder='filter'
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className='list-unstyled'>
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().includes(value)
          )}
        </ul>
      </div>
    )
  }
)
