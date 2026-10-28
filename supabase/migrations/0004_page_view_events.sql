-- Contact clicks (phone, e-mail, directions, enquiry sent) recorded alongside page views.
-- Null means the row is a page view, so every existing row stays one.

ALTER TABLE "page_views" ADD COLUMN "event" text;
