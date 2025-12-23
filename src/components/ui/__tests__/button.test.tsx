import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("should render button with text", () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("should render with default variant and size", () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-slot", "button");
    });

    it("should apply custom className", () => {
      render(<Button className="custom-class">Styled Button</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });
  });

  describe("Variants", () => {
    it("should render with destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-destructive");
    });

    it("should render with outline variant", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("outline");
    });

    it("should render with secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-secondary");
    });

    it("should render with ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("hover:bg-accent");
    });

    it("should render with link variant", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("text-primary");
      expect(button.className).toContain("underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("should render with small size", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-8");
    });

    it("should render with large size", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-10");
    });

    it("should render with icon size", () => {
      render(
        <Button size="icon" aria-label="Icon button">
          Icon
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("size-9");
    });
  });

  describe("Interactions", () => {
    it("should call onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Accessible</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("State", () => {
    it("should show disabled state with reduced opacity", () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button.className).toContain("disabled:opacity-50");
    });

    it("should accept type attribute", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("asChild prop", () => {
    it("should render as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveAttribute("data-slot", "button");
    });
  });
});
