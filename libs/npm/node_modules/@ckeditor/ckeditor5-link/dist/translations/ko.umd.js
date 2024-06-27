/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

( e => {
const { [ 'ko' ]: { dictionary, getPluralForm } } = {"ko":{"dictionary":{"Unlink":"링크 삭제","Link":"링크","Link URL":"링크 주소","Link URL must not be empty.":"링크 URL은 비워둘 수 없습니다.","Link image":"사진 링크","Edit link":"링크 편집","Open link in new tab":"새 탭에서 링크 열기","This link has no URL":"이 주소에는 URL이 없습니다.","Open in a new tab":"새 탭에서 열기","Downloadable":"다운로드 가능","Create link":"링크 생성","Move out of a link":"링크 밖으로 이동"},getPluralForm(n){return 0;}}};
e[ 'ko' ] ||= { dictionary: {}, getPluralForm: null };
e[ 'ko' ].dictionary = Object.assign( e[ 'ko' ].dictionary, dictionary );
e[ 'ko' ].getPluralForm = getPluralForm;
} )( window.CKEDITOR_TRANSLATIONS ||= {} );
