import {
  AUTHOR_PROFILES,
  listAuthorProfiles as sharedList,
  findAuthorById as sharedFindById,
  findAuthorBySlug as sharedFindBySlug,
} from '../../shared/blogAuthors.js';

export const blogAuthorProfiles = AUTHOR_PROFILES;

export function listBlogAuthors() {
  return sharedList();
}

export function getBlogAuthorById(id) {
  return sharedFindById(id);
}

export function getBlogAuthorBySlug(slug) {
  return sharedFindBySlug(slug);
}
